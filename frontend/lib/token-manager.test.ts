import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tokenManager, TokenData, UserData } from './token-manager';

// Mock document.cookie
const mockCookies: Record<string, string> = {};

Object.defineProperty(document, 'cookie', {
  get: () => {
    return Object.entries(mockCookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  },
  set: (cookieString: string) => {
    const [key, value] = cookieString.split('=');
    if (value === 'expires=Thu, 01 Jan 1970 00:00:00 GMT') {
      delete mockCookies[key];
    } else {
      mockCookies[key] = value.split(';')[0];
    }
  },
  configurable: true,
});

describe('TokenManager', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    Object.keys(mockCookies).forEach((key) => delete mockCookies[key]);
  });

  describe('getAccessToken', () => {
    it('should return null when no access token is set', () => {
      const token = tokenManager.getAccessToken();
      expect(token).toBeNull();
    });

    it('should return access token when set', () => {
      mockCookies['access_token'] = 'test-access-token';
      const token = tokenManager.getAccessToken();
      expect(token).toBe('test-access-token');
    });
  });

  describe('getRefreshToken', () => {
    it('should return null when no refresh token is set', () => {
      const token = tokenManager.getRefreshToken();
      expect(token).toBeNull();
    });

    it('should return refresh token when set', () => {
      mockCookies['refresh_token'] = 'test-refresh-token';
      const token = tokenManager.getRefreshToken();
      expect(token).toBe('test-refresh-token');
    });
  });

  describe('setTokens', () => {
    it('should set access and refresh tokens', () => {
      const tokens: TokenData = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      tokenManager.setTokens(tokens);

      expect(mockCookies['access_token']).toBe('new-access-token');
      expect(mockCookies['refresh_token']).toBe('new-refresh-token');
    });
  });

  describe('clearTokens', () => {
    it('should remove all tokens', () => {
      mockCookies['access_token'] = 'test-access-token';
      mockCookies['refresh_token'] = 'test-refresh-token';

      tokenManager.clearTokens();

      expect(mockCookies['access_token']).toBeUndefined();
      expect(mockCookies['refresh_token']).toBeUndefined();
    });
  });

  describe('hasTokens', () => {
    it('should return false when no tokens are set', () => {
      expect(tokenManager.hasTokens()).toBe(false);
    });

    it('should return false when only access token is set', () => {
      mockCookies['access_token'] = 'test-access-token';
      expect(tokenManager.hasTokens()).toBe(false);
    });

    it('should return false when only refresh token is set', () => {
      mockCookies['refresh_token'] = 'test-refresh-token';
      expect(tokenManager.hasTokens()).toBe(false);
    });

    it('should return true when both tokens are set', () => {
      mockCookies['access_token'] = 'test-access-token';
      mockCookies['refresh_token'] = 'test-refresh-token';
      expect(tokenManager.hasTokens()).toBe(true);
    });
  });

  describe('getUserFromToken', () => {
    it('should return null when no access token is set', () => {
      const user = tokenManager.getUserFromToken();
      expect(user).toBeNull();
    });

    it('should return null when token is invalid', () => {
      mockCookies['access_token'] = 'invalid-token';
      const user = tokenManager.getUserFromToken();
      expect(user).toBeNull();
    });

    it('should return user data from valid JWT token', () => {
      // Create a mock JWT token with payload
      const payload = {
        sub: 1,
        email: 'test@example.com',
        name: 'Test User',
        address: '123 Test St',
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      mockCookies['access_token'] = mockToken;

      const user = tokenManager.getUserFromToken();

      expect(user).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        address: '123 Test St',
      });
    });

    it('should handle missing optional fields', () => {
      const payload = {
        sub: 1,
        email: 'test@example.com',
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;
      mockCookies['access_token'] = mockToken;

      const user = tokenManager.getUserFromToken();

      expect(user).toEqual({
        id: 1,
        email: 'test@example.com',
        name: '',
        address: '',
      });
    });
  });
});
