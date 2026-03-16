import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksTables1710000003000 implements MigrationInterface {
  name = 'CreateTasksTables1710000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Task columns
    await queryRunner.query(`
      CREATE TABLE "task_columns" (
        "id"         UUID NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" UUID NOT NULL,
        "name"       VARCHAR(100) NOT NULL,
        "position"   INT NOT NULL DEFAULT 0,
        "color"      VARCHAR(20) NOT NULL DEFAULT '#6B7280',
        "wip_limit"  INT,
        CONSTRAINT "PK_task_columns" PRIMARY KEY ("id"),
        CONSTRAINT "FK_task_columns_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_task_columns_project_id" ON "task_columns" ("project_id")`);

    // Task priority enum
    await queryRunner.query(`CREATE TYPE "task_priority_enum" AS ENUM ('LOW','MEDIUM','HIGH','URGENT')`);

    // Tasks
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id"          UUID NOT NULL DEFAULT uuid_generate_v4(),
        "column_id"   UUID NOT NULL,
        "project_id"  UUID NOT NULL,
        "title"       VARCHAR(255) NOT NULL,
        "description" TEXT,
        "priority"    "task_priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "position"    FLOAT NOT NULL DEFAULT 0,
        "due_date"    TIMESTAMPTZ,
        "assignee_id" UUID,
        "reporter_id" UUID,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_column" FOREIGN KEY ("column_id") REFERENCES "task_columns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tasks_assignee" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_tasks_reporter" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_column_id" ON "tasks" ("column_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_project_id" ON "tasks" ("project_id")`);

    // Comments
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id"        UUID NOT NULL DEFAULT uuid_generate_v4(),
        "task_id"   UUID NOT NULL,
        "author_id" UUID NOT NULL,
        "body"      TEXT NOT NULL,
        "is_edited" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_comments_task" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_comments_task_id" ON "comments" ("task_id")`);

    // Attachments
    await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id"          UUID NOT NULL DEFAULT uuid_generate_v4(),
        "task_id"     UUID NOT NULL,
        "uploader_id" UUID NOT NULL,
        "file_name"   VARCHAR(255) NOT NULL,
        "file_url"    VARCHAR(1000) NOT NULL,
        "mime_type"   VARCHAR(100) NOT NULL,
        "file_size"   INT NOT NULL,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attachments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attachments_task" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_attachments_uploader" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_attachments_task_id" ON "attachments" ("task_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "attachments"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TABLE "task_columns"`);
    await queryRunner.query(`DROP TYPE "task_priority_enum"`);
  }
}
