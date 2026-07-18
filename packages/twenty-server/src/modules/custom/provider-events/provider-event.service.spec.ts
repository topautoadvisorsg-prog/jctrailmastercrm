import { type DataSource } from 'typeorm';

import { ProviderEventService } from 'src/modules/custom/provider-events/provider-event.service';

const providerEvent = {
  id: 'event-id',
  workspaceId: 'workspace-id',
  provider: 'twilio' as const,
  eventType: 'message.received',
  externalEventId: 'SM123',
  payloadHash:
    '43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777',
  receivedAt: new Date('2026-05-29T00:00:00.000Z'),
  processedAt: null,
  status: 'received' as const,
  errorMessage: null,
  metadata: {},
};

describe('ProviderEventService', () => {
  it('uses a stable payload hash before inserting provider events', async () => {
    const query = jest.fn().mockResolvedValue([providerEvent]);
    const service = new ProviderEventService({
      query,
    } as unknown as DataSource);

    await service.recordReceivedEvent({
      workspaceId: 'workspace-id',
      provider: 'twilio',
      eventType: 'message.received',
      externalEventId: 'SM123',
      payload: { b: 2, a: 1 },
    });

    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'workspace-id',
      'twilio',
      'message.received',
      'SM123',
      providerEvent.payloadHash,
      '{}',
    ]);
  });

  it('returns duplicate status when the provider event already exists', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([providerEvent]);
    const service = new ProviderEventService({
      query,
    } as unknown as DataSource);

    await expect(
      service.recordReceivedEvent({
        workspaceId: 'workspace-id',
        provider: 'twilio',
        eventType: 'message.received',
        externalEventId: 'SM123',
        payload: { a: 1, b: 2 },
      }),
    ).resolves.toEqual({
      ...providerEvent,
      status: 'duplicate',
    });
  });
});
