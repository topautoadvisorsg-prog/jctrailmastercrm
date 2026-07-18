import { AppPath } from 'twenty-shared/types';

import { crmModuleConfigs } from '~/pages/crm/constants/crmModuleConfigs';

describe('crmModuleConfigs', () => {
  it('uses shared AppPath values for native Twenty object handoffs', () => {
    expect(crmModuleConfigs.contacts.objectPath).toBe(AppPath.PeoplePage);
    expect(crmModuleConfigs.companies.objectPath).toBe(AppPath.CompaniesPage);
    expect(crmModuleConfigs.deals.objectPath).toBe(AppPath.OpportunitiesPage);
    expect(crmModuleConfigs.tasks.objectPath).toBe(AppPath.TasksPage);
  });

  it('keeps each module metric aligned to its module key', () => {
    expect(
      Object.values(crmModuleConfigs).map(({ key, metricKey }) => ({
        key,
        metricKey,
      })),
    ).toEqual([
      { key: 'contacts', metricKey: 'contacts' },
      { key: 'companies', metricKey: 'companies' },
      { key: 'deals', metricKey: 'deals' },
      { key: 'tasks', metricKey: 'tasks' },
    ]);
  });
});
