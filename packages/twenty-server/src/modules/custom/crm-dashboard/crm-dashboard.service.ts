import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { type DataSource } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import {
  type CrmDashboardActivity,
  type CrmDashboardProviderHealth,
  type CrmDashboardResponse,
  type CrmDashboardSummary,
} from 'src/modules/custom/crm-dashboard/crm-dashboard.types';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';

@Injectable()
export class CrmDashboardService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
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
      ],
      recentActivities,
      providerHealth,
    };
  }

  private getSummary(
    recordCounts: {
      contacts: number;
      companies: number;
      deals: number;
      tasks: number;
    },
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
        recordCounts.tasks,
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

  private async getRecordCounts(authContext: WorkspaceAuthContext): Promise<{
    contacts: number;
    companies: number;
    deals: number;
    tasks: number;
  }> {
    const workspaceId = authContext.workspace.id;

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const [
          personRepository,
          companyRepository,
          opportunityRepository,
          taskRepository,
        ] = await Promise.all([
          this.globalWorkspaceOrmManager.getRepository<PersonWorkspaceEntity>(
            workspaceId,
            'person',
          ),
          this.globalWorkspaceOrmManager.getRepository<CompanyWorkspaceEntity>(
            workspaceId,
            'company',
          ),
          this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
            workspaceId,
            'opportunity',
          ),
          this.globalWorkspaceOrmManager.getRepository<TaskWorkspaceEntity>(
            workspaceId,
            'task',
          ),
        ]);

        const [contacts, companies, deals, tasks] = await Promise.all([
          personRepository.count(),
          companyRepository.count(),
          opportunityRepository.count(),
          taskRepository.count(),
        ]);

        return { contacts, companies, deals, tasks };
      },
      authContext,
    );
  }

  private async getRecentActivities(
    workspaceId: string,
  ): Promise<CrmDashboardActivity[]> {
    return this.coreDataSource.query<CrmDashboardActivity[]>(
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
  }

  private async getProviderHealth(
    workspaceId: string,
  ): Promise<CrmDashboardProviderHealth[]> {
    return this.coreDataSource.query<CrmDashboardProviderHealth[]>(
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
  }
}
