import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { UsersModel } from 'src/models/users.model';
import { UsersTokenModel } from 'src/models/users_token.model';

export interface RefreshTokenPayload {
  sub: number;
  type: string;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'refresh-token') {
  constructor(
    private configService: ConfigService,
    @InjectModel(UsersModel)
    private usersModel: typeof UsersModel,
    @InjectModel(UsersTokenModel)
    private usersTokenModel: typeof UsersTokenModel,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret-key',
    });
  }

  async validate(payload: RefreshTokenPayload) {
    const tokenRecord = await this.usersTokenModel.findOne({
      where: {
        user_id: payload.sub,
        expires_at: { $gt: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersModel.findByPk(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.user_id,
      email: user.email,
      name: user.name,
    };
  }
}
