import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1710000004000 implements MigrationInterface {
  name = 'CreateNotificationsTable1710000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'TASK_ASSIGNED',
        'TASK_COMMENTED',
        'TASK_MENTIONED',
        'TASK_DUE_SOON',
        'MEMBER_INVITED',
        'MEMBER_JOINED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"            UUID NOT NULL DEFAULT uuid_generate_v4(),
        "recipient_id"  UUID NOT NULL,
        "type"          "notification_type_enum" NOT NULL,
        "title"         VARCHAR(255) NOT NULL,
        "body"          TEXT NOT NULL,
        "resource_id"   VARCHAR(100),
        "resource_type" VARCHAR(50),
        "is_read"       BOOLEAN NOT NULL DEFAULT false,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_recipient" FOREIGN KEY ("recipient_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient_id" ON "notifications" ("recipient_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient_unread"
       ON "notifications" ("recipient_id", "is_read")
       WHERE is_read = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
  }
}
