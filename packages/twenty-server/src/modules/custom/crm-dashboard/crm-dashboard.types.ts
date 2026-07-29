export type CrmDashboardMetric = {
  key: 'contacts' | 'companies' | 'deals' | 'tasks' | 'workOrders';
  label: string;
  value: number;
  description: string;
};

export type CrmDashboardActivity = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorType: string;
  actorId: string;
  contactId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

export type CrmDashboardProviderHealth = {
  provider: string;
  received: number;
  processed: number;
  failed: number;
  duplicates: number;
  lastReceivedAt: Date | null;
};

export type CrmDashboardProviderHealthStatus =
  | 'quiet'
  | 'healthy'
  | 'needs-attention';

export type CrmDashboardSummary = {
  totalRecords: number;
  recentActivityCount: number;
  providerEventsReceived: number;
  providerEventsFailed: number;
  providerEventsDuplicated: number;
  providerHealthStatus: CrmDashboardProviderHealthStatus;
};

export type CrmDashboardResponse = {
  generatedAt: Date;
  workspaceId: string;
  summary: CrmDashboardSummary;
  metrics: CrmDashboardMetric[];
  recentActivities: CrmDashboardActivity[];
  providerHealth: CrmDashboardProviderHealth[];
};
