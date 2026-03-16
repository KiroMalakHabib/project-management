import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayload } from './dto/auth-payload.type';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput): Promise<AuthPayload> {
    return this.authService.register(input.email, input.password, input.fullName);
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input.email, input.password);
  }

  @Mutation(() => AuthPayload)
  async refreshToken(@Args('token') token: string): Promise<AuthPayload> {
    // Decode without verifying to get userId and tokenId, then verify in service
    const jwt = await import('jsonwebtoken');
    let payload: any;
    try {
      payload = jwt.decode(token) as any;
    } catch {
      throw new Error('Invalid token');
    }
    if (!payload?.sub || !payload?.tokenId) throw new Error('Invalid token structure');
    return this.authService.refreshToken(payload.sub, payload.tokenId, token);
  }

  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: User,
    @Args('tokenId') tokenId: string,
  ): Promise<boolean> {
    return this.authService.logout(user.id, tokenId);
  }
}
