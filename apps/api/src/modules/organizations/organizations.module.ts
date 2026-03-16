import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-member.entity';
import { OrganizationInvite } from './entities/organization-invite.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsResolver } from './organizations.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationMember, OrganizationInvite])],
  providers: [OrganizationsService, OrganizationsResolver],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
