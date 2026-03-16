import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsEnum } from 'class-validator';
import { OrgRole } from '../../../common/enums/role.enum';

@InputType()
export class InviteMemberInput {
  @Field()
  @IsEmail()
  email: string;

  @Field(() => OrgRole)
  @IsEnum(OrgRole)
  role: OrgRole;
}
