import { createHash } from 'crypto';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { type DataSource } from 'typeorm';

import {
  type ProviderEventRecord,
  type RecordProviderEventInput,
} from 'src/modules/custom/provider-events/provider-event.types';

@Injectable()
export class ProviderEventService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async recordReceivedEvent(
    input: RecordProviderEventInput,
  ): Promise<ProviderEventRecord> {
    const payloadHash = this.hashPayload(input.payload);
    const metadata = JSON.stringify(input.metadata ?? {});

    if (!input.externalEventId) {
      return this.insertReceivedEvent(input, payloadHash, metadata);
    }

    const [createdEvent] = await this.coreDataSource.query<
      Array<ProviderEventRecord>
    >(
      `
        INSERT INTO "core"."crmProviderEvent" (
          "workspaceId",
          "provider",
          "eventType",
          "externalEventId",
          "payloadHash",
          "metadata"
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        ON CONFLICT ("workspaceId", "provider", "externalEventId")
        WHERE "externalEventId" IS NOT NULL
        DO NOTHING
        RETURNING
          "id",
          "workspaceId",
          "provider",
          "eventType",
          "externalEventId",
          "payloadHash",
          "receivedAt",
          "processedAt",
          "status",
          "errorMessage",
          "metadata"
      `,
      [
        input.workspaceId,
        input.provider,
        input.eventType,
        input.externalEventId,
        payloadHash,
        metadata,
      ],
    );

    if (createdEvent) {
      return createdEvent;
    }

    const existingEvent = await this.findExistingProviderEvent(input);

    return {
      ...existingEvent,
      status: 'duplicate',
    };
  }

  private async insertReceivedEvent(
    input: RecordProviderEventInput,
    payloadHash: string,
    metadata: string,
  ): Promise<ProviderEventRecord> {
    const [createdEvent] = await this.coreDataSource.query<
      Array<ProviderEventRecord>
    >(
      `
        INSERT INTO "core"."crmProviderEvent" (
          "workspaceId",
          "provider",
          "eventType",
          "externalEventId",
          "payloadHash",
          "metadata"
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING
          "id",
          "workspaceId",
          "provider",
          "eventType",
          "externalEventId",
          "payloadHash",
          "receivedAt",
          "processedAt",
          "status",
          "errorMessage",
          "metadata"
      `,
      [
        input.workspaceId,
        input.provider,
        input.eventType,
        null,
        payloadHash,
        metadata,
      ],
    );

    return this.ensureProviderEventRecord(createdEvent);
  }

  private async findExistingProviderEvent(
    input: RecordProviderEventInput & { externalEventId: string },
  ): Promise<ProviderEventRecord> {
    const [existingEvent] = await this.coreDataSource.query<
      Array<ProviderEventRecord>
    >(
      `
        SELECT
          "id",
          "workspaceId",
          "provider",
          "eventType",
          "externalEventId",
          "payloadHash",
          "receivedAt",
          "processedAt",
          "status",
          "errorMessage",
          "metadata"
        FROM "core"."crmProviderEvent"
        WHERE "workspaceId" = $1
          AND "provider" = $2
          AND "externalEventId" = $3
        LIMIT 1
      `,
      [input.workspaceId, input.provider, input.externalEventId],
    );

    return this.ensureProviderEventRecord(existingEvent);
  }

  private hashPayload(payload: unknown): string {
    return createHash('sha256')
      .update(this.stringifyStable(payload))
      .digest('hex');
  }

  private stringifyStable(payload: unknown): string {
    if (Array.isArray(payload)) {
      return `[${payload.map((item) => this.stringifyStable(item)).join(',')}]`;
    }

    if (payload !== null && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;

      return `{${Object.keys(record)
        .sort()
        .map(
          (key) =>
            `${JSON.stringify(key)}:${this.stringifyStable(record[key])}`,
        )
        .join(',')}}`;
    }

    return JSON.stringify(payload) ?? 'undefined';
  }

  private ensureProviderEventRecord(
    providerEventRecord: ProviderEventRecord | undefined,
  ): ProviderEventRecord {
    if (!providerEventRecord) {
      throw new InternalServerErrorException('Provider event was not recorded');
    }

    return providerEventRecord;
  }
}
