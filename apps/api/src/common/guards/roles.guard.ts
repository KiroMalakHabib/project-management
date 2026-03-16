import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { OrgRole } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;

    if (!user) throw new ForbiddenException('Not authenticated');

    // orgRole is attached by OrganizationMemberGuard in the resolver context
    const { orgRole } = ctx.getContext();
    if (!orgRole) throw new ForbiddenException('No organization role found');

    const roleHierarchy: Record<OrgRole, number> = {
      [OrgRole.OWNER]: 4,
      [OrgRole.ADMIN]: 3,
      [OrgRole.MEMBER]: 2,
      [OrgRole.VIEWER]: 1,
    };

    const userLevel = roleHierarchy[orgRole as OrgRole] ?? 0;
    const minRequired = Math.min(
      ...requiredRoles.map((r) => roleHierarchy[r] ?? 0),
    );

    if (userLevel < minRequired) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
