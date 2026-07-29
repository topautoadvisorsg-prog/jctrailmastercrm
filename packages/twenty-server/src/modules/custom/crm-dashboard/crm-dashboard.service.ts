import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { type DataSource } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { computeTableName } from 'src/engine/utils/compute-table-name.util';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import {
  type CrmDashboardActivity,
  type CrmDashboardProviderHealth,
  type CrmDashboardResponse,
  type CrmDashboardSummary,
} from 'src/modules/custom/crm-dashboard/crm-dashboard.types';

type CrmDashboardRecordCounts = {
  contacts: number;
  companies: number;
  deals: number;
  tasks: number;
  workOrders: number;
};

const CRM_DASHBOARD_RECORD_COUNT_OBJECTS = [
  { key: 'contacts', objectNameSingular: 'person', isCustom: false },
  { key: 'companies', objectNameSingular: 'company', isCustom: false },
  { key: 'deals', objectNameSingular: 'opportunity', isCustom: false },
  { key: 'tasks', objectNameSingular: 'task', isCustom: false },
  { key: 'workOrders', objectNameSingular: 'workOrder', isCustom: true },
] as const;

@Injectable()
export class CrmDashboardService {
  private readonly logger = new Logger(CrmDashboardService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async getDashboard(
    authContext: WorkspaceAuthContext,
  ): Promise<CrmDashboardResponse> {
    const workspaceId = authContext.workspace.id;

    const [recordCounts, recentActivities, providerHealth] = await Promise.all([
      this.getRecordCounts(authContext),
      this.getRecentActivities(workspaceId),
      this.getProviderHealth(workspaceId),
    ]);

    return {
      generatedAt: new Date(),
      workspaceId,
      summary: this.getSummary(recordCounts, recentActivities, providerHealth),
      metrics: [
        {
          key: 'contacts',
          label: 'Contacts',
          value: recordCounts.contacts,
          description: 'People records available in this workspace.',
        },
        {
          key: 'companies',
          label: 'Companies',
          value: recordCounts.companies,
          description: 'Account records available in this workspace.',
        },
        {
          key: 'deals',
          label: 'Total Deals',
          value: recordCounts.deals,
          description: 'All opportunity records tracked in Twenty, any stage.',
        },
        {
          key: 'tasks',
          label: 'Tasks',
          value: recordCounts.tasks,
          description: 'Task records ready for follow-up.',
        },
        {
          key: 'workOrders',
          label: 'Work Orders',
          value: recordCounts.workOrders,
          description:
            'Service work orders created from leads, calls, and jobs.',
        },
      ],
      recentActivities,
      providerHealth,
    };
  }

  private getSummary(
    recordCounts: CrmDashboardRecordCounts,
    recentActivities: CrmDashboardActivity[],
    providerHealth: CrmDashboardProviderHealth[],
  ): CrmDashboardSummary {
    const providerEventsReceived = providerHealth.reduce(
      (total, provider) => total + provider.received,
      0,
    );
    const providerEventsFailed = providerHealth.reduce(
      (total, provider) => total + provider.failed,
      0,
    );
    const providerEventsDuplicated = providerHealth.reduce(
      (total, provider) => total + provider.duplicates,
      0,
    );

    return {
      totalRecords:
        recordCounts.contacts +
        recordCounts.companies +
        recordCounts.deals +
        recordCounts.tasks +
        recordCounts.workOrders,
      recentActivityCount: recentActivities.length,
      providerEventsReceived,
      providerEventsFailed,
      providerEventsDuplicated,
      providerHealthStatus:
        providerEventsFailed > 0
          ? 'needs-attention'
          : providerEventsReceived > 0
            ? 'healthy'
            : 'quiet',
    };
  }

  private async getRecordCounts(
    authContext: WorkspaceAuthContext,
  ): Promise<CrmDashboardRecordCounts> {
    const workspaceId = authContext.workspace.id;

    const countEntries = await Promise.all(
      CRM_DASHBOARD_RECORD_COUNT_OBJECTS.map(async (objectDefinition) => {
        const count = await this.countWorkspaceTable(
          workspaceId,
          objectDefinition.objectNameSingular,
          objectDefinition.isCustom,
        );

        return [objectDefinition.key, count] as const;
      }),
    );

    return Object.fromEntries(countEntries) as CrmDashboardRecordCounts;
  }

  private async countWorkspaceTable(
    workspaceId: string,
    objectMetadataNameSingular: string,
    isCustom: boolean,
  ): Promise<number> {
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const tableName = computeTableName(objectMetadataNameSingular, isCustom);

    try {
      const rows = await this.queryCoreDataSource<{ count: number }[]>(
        `
          SELECT COUNT(*)::int AS "count"
          FROM "${schemaName}"."${tableName}"
          WHERE "deletedAt" IS NULL
        `,
        [],
      );

      return Number(rows[0]?.count ?? 0);
    } catch (error) {
      if (!this.canSkipDashboardCountError(error)) {
        throw error;
      }

      this.logger.debug(
        `CRM dashboard count for ${objectMetadataNameSingular} is unavailable in workspace ${workspaceId}: ${
          this.getDashboardCountErrorMessage(error) ?? 'unknown error'
        }`,
      );

      return 0;
    }
  }

  private canSkipDashboardCountError(error: unknown): boolean {
    const message = this.getDashboardCountErrorMessage(error)?.toLowerCase();

    if (!message) {
      return false;
    }

    return (
      message.includes('permission') ||
      message.includes('no metadata') ||
      message.includes('not found') ||
      message.includes('does not exist')
    );
  }

  private getDashboardCountErrorMessage(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return undefined;
  }

  private async getRecentActivities(
    workspaceId: string,
  ): Promise<CrmDashboardActivity[]> {
    try {
      return await this.queryCoreDataSource<CrmDashboardActivity[]>(
        `
          SELECT
            "id",
            "entityType",
            "entityId",
            "action",
            "actorType",
            "actorId",
            "contactId",
            "metadata",
            "createdAt"
          FROM "core"."crmActivityLog"
          WHERE "workspaceId" = $1
          ORDER BY "createdAt" DESC
          LIMIT 8
        `,
        [workspaceId],
      );
    } catch (error) {
      if (!this.canSkipDashboardCountError(error)) {
        throw error;
      }

      this.logger.debug(
        `CRM dashboard recent activity is unavailable in workspace ${workspaceId}: ${
          this.getDashboardCountErrorMessage(error) ?? 'unknown error'
        }`,
      );

      return [];
    }
  }

  private async getProviderHealth(
    workspaceId: string,
  ): Promise<CrmDashboardProviderHealth[]> {
    try {
      return await this.queryCoreDataSource<CrmDashboardProviderHealth[]>(
        `
          SELECT
            "provider",
            COUNT(*)::int AS "received",
            COUNT(*) FILTER (WHERE "status" = 'processed')::int AS "processed",
            COUNT(*) FILTER (WHERE "status" = 'failed')::int AS "failed",
            COUNT(*) FILTER (WHERE "status" = 'duplicate')::int AS "duplicates",
            MAX("receivedAt") AS "lastReceivedAt"
          FROM "core"."crmProviderEvent"
          WHERE "workspaceId" = $1
          GROUP BY "provider"
          ORDER BY MAX("receivedAt") DESC
          LIMIT 8
        `,
        [workspaceId],
      );
    } catch (error) {
      if (!this.canSkipDashboardCountError(error)) {
        throw error;
      }

      this.logger.debug(
        `CRM dashboard provider health is unavailable in workspace ${workspaceId}: ${
          this.getDashboardCountErrorMessage(error) ?? 'unknown error'
        }`,
      );

      return [];
    }
  }

  private async queryCoreDataSource<T>(
    query: string,
    parameters: unknown[],
  ): Promise<T> {
    const queryWithPermissionOptions = this.coreDataSource.query as (
      query: string,
      parameters?: unknown[],
      queryRunner?: unknown,
      options?: { shouldBypassPermissionChecks?: boolean },
    ) => Promise<T>;

    return queryWithPermissionOptions.call(
      this.coreDataSource,
      query,
      parameters,
      undefined,
      {
        shouldBypassPermissionChecks: true,
      },
    );
  }
}
