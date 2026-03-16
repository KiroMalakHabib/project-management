import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';

const mockUser = { id: 'user-1', email: 'test@example.com', fullName: 'Test User' };

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should start unauthenticated with no tokens', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('login', () => {
    it('should set user, tokens and isAuthenticated', () => {
      useAuthStore.getState().login(mockUser, 'access-123', 'refresh-456');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-123');
      expect(state.refreshToken).toBe('refresh-456');
    });

    it('should persist tokens to localStorage', () => {
      useAuthStore.getState().login(mockUser, 'access-123', 'refresh-456');

      expect(localStorage.getItem('accessToken')).toBe('access-123');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-456');
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      useAuthStore.getState().login(mockUser, 'access-123', 'refresh-456');
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });

    it('should remove tokens from localStorage', () => {
      useAuthStore.getState().login(mockUser, 'access-123', 'refresh-456');
      useAuthStore.getState().logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should update the user in state', () => {
      useAuthStore.getState().setUser(mockUser);

      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe('setTokens', () => {
    it('should update access and refresh tokens', () => {
      useAuthStore.getState().setTokens('new-access', 'new-refresh');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('new-refresh');
    });
  });
});
