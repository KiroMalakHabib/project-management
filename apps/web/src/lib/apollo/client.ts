'use client';

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',
});

// ── Token helpers ────────────────────────────────────────────────────────────

function isTokenExpired(token: string): boolean {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    return exp != null && exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Deduplicates concurrent refresh calls so only one request fires at a time
let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken || isTokenExpired(refreshToken)) return null;

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation RefreshToken($token: String!) {
          refreshToken(token: $token) { accessToken refreshToken }
        }`,
        variables: { token: refreshToken },
      }),
    });

    const json = await res.json();
    const tokens = json?.data?.refreshToken;
    if (!tokens) return null;

    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    document.cookie = `accessToken=${tokens.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

    return tokens.accessToken;
  } catch {
    return null;
  }
}

async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem('accessToken');

  if (token && !isTokenExpired(token)) return token;

  // Token missing or expired — refresh (deduplicate parallel calls)
  if (!_refreshPromise) {
    _refreshPromise = refreshAccessToken().finally(() => {
      _refreshPromise = null;
    });
  }

  const newToken = await _refreshPromise;

  // Refresh failed — clear stale credentials
  if (!newToken) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    document.cookie = 'accessToken=; path=/; max-age=0';
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return newToken;
}

// ── Auth link (proactively refreshes before each request) ───────────────────

const authLink = setContext(async (_, { headers }) => {
  if (typeof window === 'undefined') return { headers };

  const token = await getValidToken();
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

// ── WebSocket link ───────────────────────────────────────────────────────────

const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url:
            process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ||
            'ws://localhost:4000/graphql',
          connectionParams: async () => {
            const token = await getValidToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      )
    : null;

// ── Split: subscriptions → WS, everything else → HTTP ──────────────────────

const splitLink = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      from([authLink, httpLink]),
    )
  : from([authLink, httpLink]);

// ── Apollo Client ────────────────────────────────────────────────────────────

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          tasks: {
            keyArgs: ['projectId', 'filters'],
            merge(_, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
