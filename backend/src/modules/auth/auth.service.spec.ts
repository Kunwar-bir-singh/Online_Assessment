import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersModel } from 'src/models/users.model';
import { UsersTokenModel } from 'src/models/users_token.model';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersModel: any;
  let usersTokenModel: any;
  let jwtService: any;

  const mockUser = {
    user_id: 1,
    email: 'test@example.com',
    name: 'Test User',
    address: '123 Test St',
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  };

  const mockUsersTokenModel = {
    destroy: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(UsersModel),
          useValue: mockUsersModel,
        },
        {
          provide: getModelToken(UsersTokenModel),
          useValue: mockUsersTokenModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersModel = module.get(getModelToken(UsersModel));
    usersTokenModel = module.get(getModelToken(UsersTokenModel));
    jwtService = module.get(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      address: '123 Test St',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      mockUsersModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUsersModel.create.mockResolvedValue({
        ...mockUser,
        get: () => mockUser,
      });
      mockJwtService.sign.mockReturnValue('mockAccessToken');
      mockUsersTokenModel.create.mockResolvedValue({});

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: mockUser.user_id,
        name: mockUser.name,
        email: mockUser.email,
        address: mockUser.address,
      });
      expect(mockUsersModel.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      mockUsersModel.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersModel.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return tokens for valid credentials', async () => {
      // Arrange
      mockUsersModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mockAccessToken');
      mockUsersTokenModel.create.mockResolvedValue({});

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockUsersModel.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        raw: true,
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      mockUsersModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      mockUsersModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'validRefreshToken';

    it('should return new tokens for valid refresh token', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue({ sub: 1 });
      mockUsersModel.findByPk.mockResolvedValue(mockUser);
      mockUsersTokenModel.destroy.mockResolvedValue(1);
      mockJwtService.sign.mockReturnValue('newAccessToken');
      mockUsersTokenModel.create.mockResolvedValue({});

      // Act
      const result = await service.refreshToken(refreshToken);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      mockJwtService.verify.mockReturnValue({ sub: 999 });
      mockUsersModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh token from database', async () => {
      // Arrange
      mockUsersTokenModel.destroy.mockResolvedValue(1);

      // Act
      await service.logout(1);

      // Assert
      expect(mockUsersTokenModel.destroy).toHaveBeenCalledWith({
        where: { user_id: 1 },
      });
    });
  });
});
