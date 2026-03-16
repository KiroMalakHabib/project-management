import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../storage/token_storage.dart';

class GraphQLClientFactory {
  static GraphQLClient create({required TokenStorage tokenStorage}) {
    final httpLink = HttpLink(
      'http://10.0.2.2:4000/graphql', // Android emulator localhost
    );

    final authLink = AuthLink(
      getToken: () async {
        final token = await tokenStorage.getAccessToken();
        return token != null ? 'Bearer $token' : null;
      },
    );

    final wsLink = WebSocketLink(
      'ws://10.0.2.2:4000/graphql',
      config: SocketClientConfig(
        autoReconnect: true,
        inactivityTimeout: const Duration(seconds: 30),
        initialPayload: () async {
          final token = await tokenStorage.getAccessToken();
          return token != null ? {'Authorization': 'Bearer $token'} : {};
        },
      ),
    );

    final link = Link.split(
      (request) => request.isSubscription,
      wsLink,
      authLink.concat(httpLink),
    );

    return GraphQLClient(
      link: link,
      cache: GraphQLCache(store: InMemoryStore()),
    );
  }
}
