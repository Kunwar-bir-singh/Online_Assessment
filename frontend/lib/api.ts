'use client';

import { tokenManager, TokenData, UserData } from './token-manager';

// Backend URL configuration
const getBackendUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

const BACKEND_API_URL = getBackendUrl();

export { tokenManager };

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Flag to prevent infinite refresh loops
let isRefreshing = false;
// Queue of pending requests to retry after refresh
let refreshQueue: (() => void)[] = [];

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = tokenManager.getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function refreshAccessToken(): Promise<void> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    throw new ApiError('No refresh token', 401);
  }

  const response = await fetch(`${BACKEND_API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await handleResponse<ApiResponse<TokenData>>(response);
  
  if (data.success && data.data) {
    tokenManager.setTokens({ 
      accessToken: data.data.accessToken, 
      refreshToken: data.data.refreshToken 
    });
  } else {
    throw new ApiError(data.message || 'Token refresh failed', 401);
  }
}

// Custom fetch with automatic token refresh
async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(await getAuthHeaders()),
    },
  });

  // If unauthorized and we have a refresh token, try to refresh
  if (response.status === 401 && tokenManager.getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      
      try {
        await refreshAccessToken();
        // Refresh successful, retry all queued requests
        refreshQueue.forEach(cb => cb());
        refreshQueue = [];
      } catch (error) {
        // Refresh failed, clear tokens and redirect to login
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/?message=session_expired';
        }
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    // Add this request to queue
    return new Promise((resolve, reject) => {
      refreshQueue.push(async () => {
        try {
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              ...(await getAuthHeaders()),
            },
          });
          resolve(retryResponse);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP Error: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
}

// Auth API
export const authApi = {
  async register(name: string, email: string, password: string, address: string): Promise<TokenData & { user: UserData }> {
    const response = await fetch(`${BACKEND_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, address }),
    });
    const data = await handleResponse<ApiResponse<TokenData & { user: UserData }>>(response);
    if (data.success && data.data) {
      tokenManager.setTokens({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken });
      return data.data;
    }
    throw new ApiError(data.message || 'Registration failed', 400);
  },

  async login(email: string, password: string): Promise<TokenData & { user: UserData }> {
    const response = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<ApiResponse<TokenData & { user: UserData }>>(response);
    if (data.success && data.data) {
      tokenManager.setTokens({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken });
      return data.data;
    }
    throw new ApiError(data.message || 'Login failed', 400);
  },

  async logout(): Promise<void> {
    try {
      const response = await authFetch(`${BACKEND_API_URL}/api/auth/logout`, {
        method: 'POST',
      });
      await handleResponse(response);
    } finally {
      tokenManager.clearTokens();
    }
  },

  async refreshToken(): Promise<TokenData> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) throw new ApiError('No refresh token', 401);

    const response = await fetch(`${BACKEND_API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await handleResponse<ApiResponse<TokenData>>(response);
    if (data.success && data.data) {
      tokenManager.setTokens({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken });
      return data.data;
    }
    throw new ApiError(data.message || 'Token refresh failed', 400);
  },
};

// Products API
export interface Product {
  product_id: number;
  product_name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
}

export const productsApi = {
  async getAll(): Promise<Product[]> {
    const response = await authFetch(`${BACKEND_API_URL}/api/products`);
    const data = await handleResponse<ApiResponse<Product[]>>(response);
    if (data.success && data.data) return data.data;
    throw new ApiError(data.message || 'Failed to fetch products', 400);
  },

  async getById(id: number): Promise<Product> {
    const response = await authFetch(`${BACKEND_API_URL}/api/products/${id}`);
    const data = await handleResponse<ApiResponse<Product>>(response);
    if (data.success && data.data) return data.data;
    throw new ApiError(data.message || 'Product not found', 404);
  },
};

// Orders API
export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface Order {
  order_id: number;
  user_id: number;
  status: string;
  total_amount: number;
  createdAt: string;
}

export const ordersApi = {
  async create(items: OrderItem[]): Promise<Order> {
    const response = await authFetch(`${BACKEND_API_URL}/api/orders`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    const data = await handleResponse<ApiResponse<Order>>(response);
    if (data.success && data.data) return data.data;
    throw new ApiError(data.message || 'Failed to create order', 400);
  },

  async getAll(): Promise<Order[]> {
    const response = await authFetch(`${BACKEND_API_URL}/api/orders`);
    const data = await handleResponse<ApiResponse<Order[]>>(response);
    if (data.success && data.data) return data.data;
    throw new ApiError(data.message || 'Failed to fetch orders', 400);
  },

  async getById(id: number): Promise<Order> {
    const response = await authFetch(`${BACKEND_API_URL}/api/orders/${id}`);
    const data = await handleResponse<ApiResponse<Order>>(response);
    if (data.success && data.data) return data.data;
    throw new ApiError(data.message || 'Order not found', 404);
  },

  getOrderStreamUrl(orderId: number): string {
    const token = tokenManager.getAccessToken();
    return `${BACKEND_API_URL}/api/orders/${orderId}/stream?token=${token}`;
  },
};
