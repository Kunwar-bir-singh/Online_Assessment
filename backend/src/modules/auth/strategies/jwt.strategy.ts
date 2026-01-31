import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { UsersModel } from 'src/models/users.model';

export interface JwtPayload {
  sub: number;
  email: string;
  type: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(UsersModel)
    private usersModel: typeof UsersModel,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    
    const user = await this.usersModel.findOne({
      where: { user_id: payload.sub },
      raw: true
    });
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
