import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { type DataSource } from 'typeorm';

import {
  type ActivityEntry,
  type LogActivityInput,
} from 'src/modules/custom/activity-log/activity-log.types';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async log(input: LogActivityInput): Promise<ActivityEntry> {
    const actorType =
      input.actorType ?? (input.actorId === 'system' ? 'system' : 'user');
    const metadata = input.metadata ?? {};

    const [createdActivity] = await this.coreDataSource.query<
      Array<{ id: string; createdAt: Date }>
    >(
      `
        INSERT INTO "core"."crmActivityLog" (
          "workspaceId",
          "entityType",
          "entityId",
          "action",
          "actorId",
          "actorType",
          "contactId",
          "metadata"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        RETURNING "id", "createdAt"
      `,
      [
        input.workspaceId,
        input.entityType,
        input.entityId,
        input.action,
        input.actorId,
        actorType,
        input.contactId ?? null,
        JSON.stringify(metadata),
      ],
    );

    if (!createdActivity) {
      throw new InternalServerErrorException('CRM activity was not recorded');
    }

    return {
      ...input,
      actorType,
      metadata,
      id: createdActivity.id,
      createdAt: createdActivity.createdAt,
    };
  }
}
