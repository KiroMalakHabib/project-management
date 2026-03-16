import { registerEnumType } from '@nestjs/graphql';

export enum OrgRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum ProjectRole {
  LEAD = 'LEAD',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

registerEnumType(OrgRole, { name: 'OrgRole' });
registerEnumType(ProjectRole, { name: 'ProjectRole' });
