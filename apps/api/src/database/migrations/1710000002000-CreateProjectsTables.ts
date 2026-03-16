import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectsTables1710000002000 implements MigrationInterface {
  name = 'CreateProjectsTables1710000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Project status enum
    await queryRunner.query(`CREATE TYPE "project_status_enum" AS ENUM ('ACTIVE','ARCHIVED')`);

    // Projects
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id"              UUID NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" UUID NOT NULL,
        "name"            VARCHAR(100) NOT NULL,
        "description"     VARCHAR(500),
        "icon_url"        VARCHAR(500),
        "status"          "project_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_projects_org_id" ON "projects" ("organization_id")`);

    // Project role enum
    await queryRunner.query(`CREATE TYPE "project_role_enum" AS ENUM ('LEAD','MEMBER','VIEWER')`);

    // Project members
    await queryRunner.query(`
      CREATE TABLE "project_members" (
        "id"         UUID NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" UUID NOT NULL,
        "user_id"    UUID NOT NULL,
        "role"       "project_role_enum" NOT NULL DEFAULT 'MEMBER',
        "joined_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_member_user" UNIQUE ("project_id", "user_id"),
        CONSTRAINT "FK_project_members_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_project_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_project_members_project_id" ON "project_members" ("project_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_project_members_user_id" ON "project_members" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "project_members"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TYPE "project_role_enum"`);
    await queryRunner.query(`DROP TYPE "project_status_enum"`);
  }
}
