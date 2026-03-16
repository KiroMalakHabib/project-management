import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { AuthPayload } from './dto/auth-payload.type';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async register(email: string, password: string, fullName: string): Promise<AuthPayload> {
    const user = await this.usersService.create(email, password, fullName);
    return this.generateTokens(user);
  }

  async login(email: string, password: string): Promise<AuthPayload> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  async refreshToken(userId: string, tokenId: string, rawRefreshToken: string): Promise<AuthPayload> {
    const storedHash = await this.redis.get(`refresh_token:${userId}:${tokenId}`);
    if (!storedHash) throw new UnauthorizedException('Refresh token expired or invalid');

    const isMatch = await bcrypt.compare(rawRefreshToken, storedHash);
    if (!isMatch) throw new UnauthorizedException('Refresh token invalid');

    // Rotate: invalidate old token
    await this.redis.del(`refresh_token:${userId}:${tokenId}`);

    const user = await this.usersService.findById(userId);
    return this.generateTokens(user);
  }

  async logout(userId: string, tokenId: string): Promise<boolean> {
    await this.redis.del(`refresh_token:${userId}:${tokenId}`);
    return true;
  }

  private async generateTokens(user: User): Promise<AuthPayload> {
    const tokenId = uuidv4();
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRY') || '15m',
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, tokenId },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRY') || '7d',
      },
    );

    // Store hashed refresh token in Redis (7 days TTL)
    const hash = await bcrypt.hash(refreshToken, 10);
    const ttlSeconds = 7 * 24 * 60 * 60;
    await this.redis.setex(`refresh_token:${user.id}:${tokenId}`, ttlSeconds, hash);

    return { accessToken, refreshToken, user };
  }
}
