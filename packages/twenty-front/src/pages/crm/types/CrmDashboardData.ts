import { type z } from 'zod';

import { type crmDashboardDataSchema } from '~/pages/crm/schemas/crmDashboardDataSchema';

export type CrmDashboardData = z.infer<typeof crmDashboardDataSchema>;

export type CrmDashboardMetric = CrmDashboardData['metrics'][number];

export type CrmDashboardMetricKey = CrmDashboardMetric['key'];

export type CrmDashboardActivity = CrmDashboardData['recentActivities'][number];

export type CrmDashboardProviderHealth =
  CrmDashboardData['providerHealth'][number];

export type CrmDashboardProviderHealthStatus =
  CrmDashboardData['summary']['providerHealthStatus'];

export type CrmDashboardSummary = CrmDashboardData['summary'];
