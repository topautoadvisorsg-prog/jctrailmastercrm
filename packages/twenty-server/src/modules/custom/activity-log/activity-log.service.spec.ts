import { InternalServerErrorException } from '@nestjs/common';
import { type DataSource } from 'typeorm';

import { ActivityLogService } from 'src/modules/custom/activity-log/activity-log.service';

describe('ActivityLogService', () => {
  const createdActivity = {
    id: 'activity-id',
    createdAt: new Date('2026-05-29T00:00:00.000Z'),
  };

  it('normalizes system actor activity before inserting and returning it', async () => {
    const query = jest.fn().mockResolvedValue([createdActivity]);
    const service = new ActivityLogService({
      query,
    } as unknown as DataSource);

    await expect(
      service.log({
        workspaceId: 'workspace-id',
        entityType: 'contact',
        entityId: 'contact-id',
        action: 'missed_call_received',
        actorId: 'system',
      }),
    ).resolves.toEqual({
      workspaceId: 'workspace-id',
      entityType: 'contact',
      entityId: 'contact-id',
      action: 'missed_call_received',
      actorId: 'system',
      actorType: 'system',
      metadata: {},
      id: createdActivity.id,
      createdAt: createdActivity.createdAt,
    });

    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'workspace-id',
      'contact',
      'contact-id',
      'missed_call_received',
      'system',
      'system',
      null,
      '{}',
    ]);
  });

  it('defaults human actors to user while preserving metadata and contact linkage', async () => {
    const query = jest.fn().mockResolvedValue([createdActivity]);
    const service = new ActivityLogService({
      query,
    } as unknown as DataSource);

    await expect(
      service.log({
        workspaceId: 'workspace-id',
        entityType: 'task',
        entityId: 'task-id',
        action: 'task_completed',
        actorId: 'user-id',
        contactId: 'contact-id',
        metadata: { source: 'crm-module', attempts: 1 },
      }),
    ).resolves.toEqual({
      workspaceId: 'workspace-id',
      entityType: 'task',
      entityId: 'task-id',
      action: 'task_completed',
      actorId: 'user-id',
      actorType: 'user',
      contactId: 'contact-id',
      metadata: { source: 'crm-module', attempts: 1 },
      id: createdActivity.id,
      createdAt: createdActivity.createdAt,
    });

    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'workspace-id',
      'task',
      'task-id',
      'task_completed',
      'user-id',
      'user',
      'contact-id',
      '{"source":"crm-module","attempts":1}',
    ]);
  });

  it('preserves explicit non-user actor types', async () => {
    const query = jest.fn().mockResolvedValue([createdActivity]);
    const service = new ActivityLogService({
      query,
    } as unknown as DataSource);

    await expect(
      service.log({
        workspaceId: 'workspace-id',
        entityType: 'workflow',
        entityId: 'workflow-id',
        action: 'workflow_triggered',
        actorId: 'mcp-session-id',
        actorType: 'mcp',
      }),
    ).resolves.toMatchObject({
      actorId: 'mcp-session-id',
      actorType: 'mcp',
      metadata: {},
    });
  });

  it('throws a clear server error when persistence returns no activity row', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const service = new ActivityLogService({
      query,
    } as unknown as DataSource);

    await expect(
      service.log({
        workspaceId: 'workspace-id',
        entityType: 'contact',
        entityId: 'contact-id',
        action: 'contact_created',
        actorId: 'system',
      }),
    ).rejects.toThrow(InternalServerErrorException);

    await expect(
      service.log({
        workspaceId: 'workspace-id',
        entityType: 'contact',
        entityId: 'contact-id',
        action: 'contact_created',
        actorId: 'system',
      }),
    ).rejects.toThrow('CRM activity was not recorded');
  });
});
