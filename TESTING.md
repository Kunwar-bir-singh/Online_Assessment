# Testing Guide

This document outlines the testing strategy and how to run tests for both backend and frontend.

## Backend Tests (NestJS + Jest)

### Setup
The backend is already configured with Jest. Install dependencies:
```bash
cd backend
pnpm install
```

### Running Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Run e2e tests
pnpm test:e2e
```

### Test Files Created

| File | Description |
|------|-------------|
| `src/modules/auth/auth.service.spec.ts` | Auth service unit tests (register, login, refresh, logout) |
| `src/modules/orders/orders.service.spec.ts` | Orders service unit tests (create, findAll, findOne, updateStatus, SSE stream) |
| `src/modules/products/products.service.spec.ts` | Products service unit tests (findAll, findOne) |
| `src/test-setup.ts` | Global test setup with environment mocks |

### Test Coverage

The tests cover:
- ✅ User registration with duplicate email validation
- ✅ User login with credential verification
- ✅ Token refresh functionality
- ✅ Order creation with product validation
- ✅ Order status retrieval and updates
- ✅ SSE stream authentication
- ✅ Product listing and retrieval
- ✅ Error handling (NotFoundException, ForbiddenException, UnauthorizedException)

## Frontend Tests (Next.js + Vitest)

### Setup
Install frontend dependencies:
```bash
cd frontend
pnpm install
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests once (CI mode)
pnpm test:run

# Run tests with UI
pnpm test:ui
```

### Test Files Created

| File | Description |
|------|-------------|
| `lib/token-manager.test.js` | Token manager unit tests (cookie operations, JWT parsing) |
| `vitest.config.ts` | Vitest configuration |
| `vitest.setup.js` | Global test setup with DOM mocks |

### Available Scripts

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:ui": "vitest --ui"
}
```

## Test Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   └── auth.service.spec.ts
│   │   ├── orders/
│   │   │   └── orders.service.spec.ts
│   │   └── products/
│   │       └── products.service.spec.ts
│   └── test-setup.ts
└── test/
    └── app.e2e-spec.ts

frontend/
├── lib/
│   └── token-manager.test.js
├── vitest.config.ts
└── vitest.setup.js
```

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use meaningful test names**: `it('should return error when user not found')`
3. **Mock external dependencies**: Database, JWT service, etc.
4. **Test error cases**: Don't only test happy paths

### Example Test

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const mockUser = { user_id: 1, email: 'test@example.com', password: hashedPassword };
      
      // Act
      const result = await authService.login(loginDto);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Test error cases
    });
  });
});
```

## CI/CD Integration

Add these to your CI pipeline:

```yaml
# Backend
- name: Run Backend Tests
  run: |
    cd backend
    pnpm install
    pnpm test

# Frontend  
- name: Run Frontend Tests
  run: |
    cd frontend
    pnpm install
    pnpm test
```
