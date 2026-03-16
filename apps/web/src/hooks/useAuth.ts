'use client';

import { useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  LOGOUT_MUTATION,
} from '@/graphql/mutations/auth.mutations';

export function useAuth() {
  const router = useRouter();
  const { login, logout: storeLogout, user, isAuthenticated } = useAuthStore();

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN_MUTATION);
  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  const signIn = async (email: string, password: string) => {
    const { data } = await loginMutation({
      variables: { input: { email, password } },
    });
    const { accessToken, refreshToken, user: authUser } = data.login;
    login(authUser, accessToken, refreshToken);
    router.push('/dashboard');
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data } = await registerMutation({
      variables: { input: { email, password, fullName } },
    });
    const { accessToken, refreshToken, user: authUser } = data.register;
    login(authUser, accessToken, refreshToken);
    router.push('/dashboard');
  };

  const signOut = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        // decode tokenId from refresh token
        const payload = JSON.parse(atob(refreshToken.split('.')[1]));
        if (payload.tokenId) {
          await logoutMutation({ variables: { tokenId: payload.tokenId } });
        }
      }
    } catch {
      // ignore logout errors
    }
    storeLogout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    loginLoading,
    registerLoading,
  };
}
