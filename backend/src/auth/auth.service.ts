import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser, JwtPayload } from './auth.types';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(credentials: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(credentials.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await compare(credentials.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const safeUser = this.usersService.toUserSummary(user);
    const payload: JwtPayload = {
      sub: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
      role: safeUser.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: safeUser,
    };
  }

  me(user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
