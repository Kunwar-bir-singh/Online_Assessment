'use client';

const ACCESS_TOKEN_NAME = 'access_token';
const REFRESH_TOKEN_NAME = 'refresh_token';
const COOKIE_EXPIRY_DAYS = 7;

export interface TokenData {
  accessToken: string;
  refreshToken: string;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  address: string;
}

// Cookie utility functions
function setCookie(name: string, value: string, days: number): void {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}

function deleteCookie(name: string): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

class TokenManager {
  getAccessToken(): string | null {
    return getCookie(ACCESS_TOKEN_NAME);
  }

  getRefreshToken(): string | null {
    return getCookie(REFRESH_TOKEN_NAME);
  }

  setTokens(data: TokenData): void {
    setCookie(ACCESS_TOKEN_NAME, data.accessToken, 1); // Access token expires in 15 minutes (short-lived)
    setCookie(REFRESH_TOKEN_NAME, data.refreshToken, COOKIE_EXPIRY_DAYS);
  }

  clearTokens(): void {
    deleteCookie(ACCESS_TOKEN_NAME);
    deleteCookie(REFRESH_TOKEN_NAME);
  }

  hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }

  getUserFromToken(): UserData | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || '',
        address: payload.address || '',
      };
    } catch {
      return null;
    }
  }
}

export const tokenManager = new TokenManager();
