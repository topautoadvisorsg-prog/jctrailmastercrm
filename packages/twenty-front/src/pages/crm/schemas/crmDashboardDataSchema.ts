import { z } from 'zod';

const crmDashboardMetricKeySchema = z.enum([
  'contacts',
  'companies',
  'deals',
  'tasks',
  'workOrders',
]);

const crmDashboardMetricSchema = z.object({
  key: crmDashboardMetricKeySchema,
  label: z.string(),
  value: z.number().int().nonnegative(),
  description: z.string(),
});

const crmDashboardActivitySchema = z.object({
  id: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  action: z.string(),
  actorType: z.string(),
  actorId: z.string(),
  contactId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
});

const crmDashboardProviderHealthSchema = z.object({
  provider: z.string(),
  received: z.number().int().nonnegative(),
  processed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  lastReceivedAt: z.string().datetime().nullable(),
});

const crmDashboardProviderHealthStatusSchema = z.enum([
  'quiet',
  'healthy',
  'needs-attention',
]);

const crmDashboardSummarySchema = z.object({
  totalRecords: z.number().int().nonnegative(),
  recentActivityCount: z.number().int().nonnegative(),
  providerEventsReceived: z.number().int().nonnegative(),
  providerEventsFailed: z.number().int().nonnegative(),
  providerEventsDuplicated: z.number().int().nonnegative(),
  providerHealthStatus: crmDashboardProviderHealthStatusSchema,
});

export const crmDashboardDataSchema = z.object({
  generatedAt: z.string().datetime(),
  workspaceId: z.string(),
  summary: crmDashboardSummarySchema,
  metrics: z.array(crmDashboardMetricSchema),
  recentActivities: z.array(crmDashboardActivitySchema),
  providerHealth: z.array(crmDashboardProviderHealthSchema),
});
