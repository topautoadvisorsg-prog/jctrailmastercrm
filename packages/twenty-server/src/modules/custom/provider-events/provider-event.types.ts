export type ProviderEventProvider =
  | 'twilio'
  | 'stripe'
  | 'resend'
  | 'google'
  | 'mcp'
  | 'system';

export type ProviderEventStatus =
  | 'received'
  | 'duplicate'
  | 'processed'
  | 'failed';

export type RecordProviderEventInput = {
  workspaceId: string;
  provider: ProviderEventProvider;
  eventType: string;
  externalEventId?: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
};

export type ProviderEventRecord = {
  id: string;
  workspaceId: string;
  provider: ProviderEventProvider;
  eventType: string;
  externalEventId?: string;
  payloadHash: string;
  receivedAt: Date;
  processedAt?: Date;
  status: ProviderEventStatus;
  errorMessage?: string;
  metadata: Record<string, unknown>;
};
