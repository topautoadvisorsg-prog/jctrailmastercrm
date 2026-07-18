import { type CrmDashboardProviderHealthStatus } from '~/pages/crm/types/CrmDashboardData';

export const formatCrmTimestamp = (value: string | null) => {
  if (value === null) {
    return 'No events yet';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const formatCrmFreshness = (value: string | undefined) => {
  if (value === undefined) {
    return 'Waiting for live data';
  }

  return `Updated ${formatCrmTimestamp(value)}`;
};

export const formatCrmActivityMetadata = (
  metadata: Record<string, unknown>,
) => {
  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  );

  if (entries.length === 0) {
    return 'No additional metadata';
  }

  return entries
    .slice(0, 2)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' / ');
};

export const formatCrmProviderHealthStatus = (
  status: CrmDashboardProviderHealthStatus | undefined,
) => {
  if (status === 'healthy') {
    return 'Healthy';
  }

  if (status === 'needs-attention') {
    return 'Needs attention';
  }

  return 'Quiet';
};
