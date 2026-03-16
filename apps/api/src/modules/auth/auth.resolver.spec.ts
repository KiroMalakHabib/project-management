import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

const mockAuthPayload = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: { id: 'user-1', email: 'test@example.com', fullName: 'Test User' },
};

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
};

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should delegate to AuthService.register and return payload', async () => {
      mockAuthService.register.mockResolvedValue(mockAuthPayload);
      const input = { email: 'test@example.com', password: 'pass', fullName: 'Test User' };

      const result = await resolver.register(input as any);

      expect(mockAuthService.register).toHaveBeenCalledWith('test@example.com', 'pass', 'Test User');
      expect(result).toEqual(mockAuthPayload);
    });
  });

  describe('login', () => {
    it('should delegate to AuthService.login and return payload', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthPayload);
      const input = { email: 'test@example.com', password: 'pass' };

      const result = await resolver.login(input as any);

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'pass');
      expect(result).toEqual(mockAuthPayload);
    });

    it('should propagate UnauthorizedException from service', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException());

      await expect(resolver.login({ email: 'x@x.com', password: 'bad' } as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should throw on malformed token', async () => {
      await expect(resolver.refreshToken('not.a.jwt')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should delegate to AuthService.logout', async () => {
      mockAuthService.logout.mockResolvedValue(true);
      const user = { id: 'user-1' } as any;

      const result = await resolver.logout(user, 'token-id-1');

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-1', 'token-id-1');
      expect(result).toBe(true);
    });
  });
});
