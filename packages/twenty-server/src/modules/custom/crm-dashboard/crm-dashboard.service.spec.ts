import { type DataSource } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { CrmDashboardService } from 'src/modules/custom/crm-dashboard/crm-dashboard.service';

const authContext = {
  workspace: {
    id: '8d0ec902-eeae-4792-a224-ab8a81926280',
  },
} as WorkspaceAuthContext;

type CountTableName =
  | 'person'
  | 'company'
  | 'opportunity'
  | 'task'
  | '_workOrder';
type CoreTableName = 'crmActivityLog' | 'crmProviderEvent';

const countTableNames: CountTableName[] = [
  'person',
  'company',
  'opportunity',
  'task',
  '_workOrder',
];

const createCoreDataSource = ({
  counts,
  failures = {},
  recentActivities = [],
  providerHealth = [],
}: {
  counts: Record<CountTableName, number>;
  failures?: Partial<Record<CountTableName | CoreTableName, unknown>>;
  recentActivities?: unknown[];
  providerHealth?: unknown[];
}) => {
  let dataSource: DataSource;
  const query = jest.fn(async function (this: DataSource, sql: string) {
    if (this !== dataSource) {
      throw new Error('lost datasource query binding');
    }

    const countTableName = countTableNames.find((candidate) =>
      sql.includes(`."${candidate}"`),
    );

    if (countTableName) {
      const failure = failures[countTableName];

      if (failure) {
        throw failure;
      }

      return [{ count: counts[countTableName] }];
    }

    if (sql.includes('"core"."crmActivityLog"')) {
      const failure = failures.crmActivityLog;

      if (failure) {
        throw failure;
      }

      return recentActivities;
    }

    if (sql.includes('"core"."crmProviderEvent"')) {
      const failure = failures.crmProviderEvent;

      if (failure) {
        throw failure;
      }

      return providerHealth;
    }

    throw new Error(`Unexpected dashboard query: ${sql}`);
  });

  dataSource = { query } as unknown as DataSource;

  return dataSource;
};

describe('CrmDashboardService', () => {
  it('returns a stable dashboard summary from workspace records and provider health', async () => {
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
    const coreDataSource = createCoreDataSource({
      counts: {
        person: 10,
        company: 4,
        opportunity: 3,
        task: 8,
        _workOrder: 2,
      },
      recentActivities,
      providerHealth,
    });
    const service = new CrmDashboardService(coreDataSource);

    await expect(service.getDashboard(authContext)).resolves.toMatchObject({
      workspaceId: authContext.workspace.id,
      summary: {
        totalRecords: 27,
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
        expect.objectContaining({ key: 'workOrders', value: 2 }),
      ],
    });

    expect(coreDataSource.query).toHaveBeenCalledTimes(7);
  });

  it('keeps the dashboard available before the Work Order object is set up', async () => {
    const coreDataSource = createCoreDataSource({
      counts: {
        person: 10,
        company: 4,
        opportunity: 3,
        task: 8,
        _workOrder: 0,
      },
      failures: {
        _workOrder: new Error('relation "_workOrder" does not exist'),
      },
    });
    const service = new CrmDashboardService(coreDataSource);

    await expect(service.getDashboard(authContext)).resolves.toMatchObject({
      summary: {
        totalRecords: 25,
      },
      metrics: expect.arrayContaining([
        expect.objectContaining({ key: 'workOrders', value: 0 }),
      ]),
    });
  });

  it('returns zero for Twenty missing-metadata object count errors', async () => {
    const coreDataSource = createCoreDataSource({
      counts: {
        person: 10,
        company: 4,
        opportunity: 3,
        task: 8,
        _workOrder: 0,
      },
      failures: {
        _workOrder: new Error('Object metadata not found'),
      },
    });
    const service = new CrmDashboardService(coreDataSource);

    await expect(service.getDashboard(authContext)).resolves.toMatchObject({
      summary: {
        totalRecords: 25,
      },
      metrics: expect.arrayContaining([
        expect.objectContaining({ key: 'workOrders', value: 0 }),
      ]),
    });
  });

  it('returns zero for permission-denied object counts without hiding the dashboard', async () => {
    const coreDataSource = createCoreDataSource({
      counts: {
        person: 10,
        company: 4,
        opportunity: 0,
        task: 8,
        _workOrder: 2,
      },
      failures: {
        opportunity: new Error(
          'Entity performing the request does not have permission',
        ),
      },
    });
    const service = new CrmDashboardService(coreDataSource);

    await expect(service.getDashboard(authContext)).resolves.toMatchObject({
      summary: {
        totalRecords: 24,
      },
      metrics: expect.arrayContaining([
        expect.objectContaining({ key: 'deals', value: 0 }),
        expect.objectContaining({ key: 'workOrders', value: 2 }),
      ]),
    });
  });

  it('returns zero for serialized permission-denied object counts', async () => {
    const coreDataSource = createCoreDataSource({
      counts: {
        person: 10,
        company: 4,
        opportunity: 0,
        task: 8,
        _workOrder: 2,
      },
      failures: {
        opportunity: 'Entity performing the request does not have permission',
      },
    });
    const service = new CrmDashboardService(coreDataSource);

    await expect(service.getDashboard(authContext)).resolves.toMatchObject({
      summary: {
        totalRecords: 24,
      },
      metrics: expect.arrayContaining([
        expect.objectContaining({ key: 'deals', value: 0 }),
        expect.objectContaining({ key: 'workOrders', value: 2 }),
      ]),
    });
  });

  it('keeps the dashboard available when CRM activity tables are not installed yet', async () => {
    const coreDataSource = createCoreDataSource({
      counts: {
        person: 10,
        company: 4,
        opportunity: 3,
        task: 8,
        _workOrder: 2,
      },
      failures: {
        crmActivityLog: new Error('relation does not exist'),
        crmProviderEvent: new Error('relation does not exist'),
      },
    });
    const service = new CrmDashboardService(coreDataSource);

    await expect(service.getDashboard(authContext)).resolves.toMatchObject({
      summary: {
        totalRecords: 27,
        recentActivityCount: 0,
        providerEventsReceived: 0,
      },
      recentActivities: [],
      providerHealth: [],
    });
  });

  it('surfaces unexpected object count failures', async () => {
    const coreDataSource = createCoreDataSource({
      counts: {
        person: 0,
        company: 4,
        opportunity: 3,
        task: 8,
        _workOrder: 2,
      },
      failures: {
        person: new Error('database unavailable'),
      },
    });
    const service = new CrmDashboardService(coreDataSource);

    await expect(service.getDashboard(authContext)).rejects.toThrow(
      'database unavailable',
    );
  });
});
