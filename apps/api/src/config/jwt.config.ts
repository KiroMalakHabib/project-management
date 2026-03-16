import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  inviteSecret: process.env.JWT_INVITE_SECRET || 'invite-secret',
  inviteExpiry: process.env.JWT_INVITE_EXPIRY || '48h',
}));
