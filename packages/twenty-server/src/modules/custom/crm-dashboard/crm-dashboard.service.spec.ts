import { type DataSource } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { CrmDashboardService } from 'src/modules/custom/crm-dashboard/crm-dashboard.service';

const authContext = {
  workspace: {
    id: 'workspace-id',
  },
} as WorkspaceAuthContext;

const createRepository = (count: number) => ({
  count: jest.fn().mockResolvedValue(count),
});

describe('CrmDashboardService', () => {
  it('returns a stable dashboard summary from workspace records and provider health', async () => {
    const personRepository = createRepository(10);
    const companyRepository = createRepository(4);
    const opportunityRepository = createRepository(3);
    const taskRepository = createRepository(8);
    const repositories = {
      person: personRepository,
      company: companyRepository,
      opportunity: opportunityRepository,
      task: taskRepository,
    };
    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest.fn(async (callback) => callback()),
      getRepository: jest.fn(async (_workspaceId, objectName) => {
        return repositories[objectName as keyof typeof repositories];
      }),
    } as unknown as GlobalWorkspaceOrmManager;
    const recentActivities = [
      {
        id: 'activity-id',
        entityType: 'person',
        entityId: 'person-id',
        action: 'contact.updated',
        actorType: 'user',
        actorId: 'user-id',
        contactId: 'person-id',
        metadata: { source: 'manual' },
        createdAt: new Date('2026-05-29T00:00:00.000Z'),
      },
    ];
    const providerHealth = [
      {
        provider: 'twilio',
        received: 5,
        processed: 3,
        failed: 1,
        duplicates: 1,
        lastReceivedAt: new Date('2026-05-29T00:00:00.000Z'),
      },
    ];
    const coreDataSource = {
      query: jest
        .fn()
        .mockResolvedValueOnce(recentActivities)
        .mockResolvedValueOnce(providerHealth),
    } as unknown as DataSource;
    const service = new CrmDashboardService(
      globalWorkspaceOrmManager,
      coreDataSource,
    );

    await expect(service.getDashboard(authContext)).resolves.toMatchObject({
      workspaceId: 'workspace-id',
      summary: {
        totalRecords: 25,
        recentActivityCount: 1,
        providerEventsReceived: 5,
        providerEventsFailed: 1,
        providerEventsDuplicated: 1,
        providerHealthStatus: 'needs-attention',
      },
      metrics: [
        expect.objectContaining({ key: 'contacts', value: 10 }),
        expect.objectContaining({ key: 'companies', value: 4 }),
        expect.objectContaining({ key: 'deals', value: 3 }),
        expect.objectContaining({ key: 'tasks', value: 8 }),
      ],
    });

    expect(globalWorkspaceOrmManager.getRepository).toHaveBeenCalledTimes(4);
    expect(coreDataSource.query).toHaveBeenCalledTimes(2);
  });
});
