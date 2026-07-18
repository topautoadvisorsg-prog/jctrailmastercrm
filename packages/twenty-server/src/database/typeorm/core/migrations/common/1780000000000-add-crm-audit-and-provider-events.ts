import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class AddCrmAuditAndProviderEvents1780000000000 implements MigrationInterface {
  name = 'AddCrmAuditAndProviderEvents1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "core"."crmActivityLog" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId" uuid NOT NULL,
        "entityType" text NOT NULL,
        "entityId" uuid NOT NULL,
        "action" text NOT NULL,
        "actorId" text NOT NULL,
        "actorType" text NOT NULL DEFAULT 'user',
        "contactId" uuid,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_crmActivityLog_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_crmActivityLog_workspace_contact_createdAt"
      ON "core"."crmActivityLog" ("workspaceId", "contactId", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_crmActivityLog_workspace_entity_createdAt"
      ON "core"."crmActivityLog" ("workspaceId", "entityType", "entityId", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_crmActivityLog_workspace_actor_createdAt"
      ON "core"."crmActivityLog" ("workspaceId", "actorId", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "core"."crmProviderEvent" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId" uuid NOT NULL,
        "provider" text NOT NULL,
        "eventType" text NOT NULL,
        "externalEventId" text,
        "payloadHash" text NOT NULL,
        "receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "processedAt" TIMESTAMP WITH TIME ZONE,
        "status" text NOT NULL DEFAULT 'received',
        "errorMessage" text,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_crmProviderEvent_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_crmProviderEvent_workspace_provider_externalEventId"
      ON "core"."crmProviderEvent" ("workspaceId", "provider", "externalEventId")
      WHERE "externalEventId" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_crmProviderEvent_workspace_provider_receivedAt"
      ON "core"."crmProviderEvent" ("workspaceId", "provider", "receivedAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_crmProviderEvent_workspace_status_receivedAt"
      ON "core"."crmProviderEvent" ("workspaceId", "status", "receivedAt" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "core"."crmProviderEvent"');
    await queryRunner.query('DROP TABLE IF EXISTS "core"."crmActivityLog"');
  }
}
