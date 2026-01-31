import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { UsersModel } from 'src/models/users.model';
import { UsersTokenModel } from 'src/models/users_token.model';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UsersModel)
    private usersModel: typeof UsersModel,
    @InjectModel(UsersTokenModel)
    private usersTokenModel: typeof UsersTokenModel,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersModel.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersModel.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      address: registerDto.address,
    } as any);
    
    const userData = user.get({ plain: true });
    console.log("userData", userData);
    
    return this.generateTokens(userData);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersModel.findOne({
      where: { email: loginDto.email },
      raw : true
    });

    if (!user) {
      throw new UnauthorizedException('This user does not exist');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify<{ sub: number }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      });

      const user = await this.usersModel.findByPk(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Delete old refresh token
      await this.usersTokenModel.destroy({
        where: { user_id: user.user_id },
      });

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(user_id: number): Promise<void> {
    await this.usersTokenModel.destroy({
      where: { user_id: user_id },
    });
  }

  private async generateTokens(user: UsersModel): Promise<AuthResponseDto> {
    const payload = {
      sub: user.user_id,
      email: user.email,
      name: user.name,
      address: user.address,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.usersTokenModel.create({
      user_id: user.user_id!,
      token: refreshToken,
      expires_at: expiresAt,
    } as any);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.user_id!,
        name: user.name,
        email: user.email,
        address: user.address,
      },
    };
  }
}
