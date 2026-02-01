// Vitest setup file for frontend tests
import '@testing-library/jest-dom';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  clear: () => {},
  removeItem: () => {},
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: () => null,
  setItem: () => {},
  clear: () => {},
  removeItem: () => {},
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
