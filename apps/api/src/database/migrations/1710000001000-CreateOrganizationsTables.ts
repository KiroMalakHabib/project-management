import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationsTables1710000001000 implements MigrationInterface {
  name = 'CreateOrganizationsTables1710000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Organizations
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id"          UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name"        VARCHAR(100) NOT NULL,
        "description" VARCHAR(500),
        "logo_url"    VARCHAR(500),
        "slug"        VARCHAR(50) NOT NULL,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organizations" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_organizations_slug" ON "organizations" ("slug")`);

    // Organization roles enum
    await queryRunner.query(`CREATE TYPE "org_role_enum" AS ENUM ('OWNER','ADMIN','MEMBER','VIEWER')`);

    // Organization members
    await queryRunner.query(`
      CREATE TABLE "organization_members" (
        "id"              UUID NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" UUID NOT NULL,
        "user_id"         UUID NOT NULL,
        "role"            "org_role_enum" NOT NULL DEFAULT 'MEMBER',
        "joined_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organization_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_org_member_user" UNIQUE ("organization_id", "user_id"),
        CONSTRAINT "FK_org_members_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_org_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_org_members_org_id" ON "organization_members" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_org_members_user_id" ON "organization_members" ("user_id")`);

    // Invite status enum
    await queryRunner.query(`CREATE TYPE "invite_status_enum" AS ENUM ('PENDING','ACCEPTED','EXPIRED')`);

    // Organization invites
    await queryRunner.query(`
      CREATE TABLE "organization_invites" (
        "id"              UUID NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" UUID NOT NULL,
        "invited_email"   VARCHAR(255) NOT NULL,
        "role"            "org_role_enum" NOT NULL DEFAULT 'MEMBER',
        "token"           VARCHAR(100) NOT NULL,
        "status"          "invite_status_enum" NOT NULL DEFAULT 'PENDING',
        "expires_at"      TIMESTAMPTZ NOT NULL,
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organization_invites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invite_token" UNIQUE ("token"),
        CONSTRAINT "FK_invites_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_invites_email" ON "organization_invites" ("invited_email")`);
    await queryRunner.query(`CREATE INDEX "IDX_invites_org_id" ON "organization_invites" ("organization_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "organization_invites"`);
    await queryRunner.query(`DROP TABLE "organization_members"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TYPE "invite_status_enum"`);
    await queryRunner.query(`DROP TYPE "org_role_enum"`);
  }
}
