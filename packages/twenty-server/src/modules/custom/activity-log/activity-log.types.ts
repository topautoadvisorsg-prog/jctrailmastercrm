export type ActivityEntityType =
  | 'contact'
  | 'company'
  | 'deal'
  | 'job'
  | 'appointment'
  | 'estimate'
  | 'invoice'
  | 'message'
  | 'task'
  | 'workflow'
  | 'workflow_run'
  | 'user'
  | 'review_request';

export type ActivityAction =
  | 'contact_created'
  | 'contact_updated'
  | 'contact_deleted'
  | 'contact_tagged'
  | 'contact_assigned'
  | 'contact_do_not_contact_set'
  | 'company_created'
  | 'company_updated'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'sms_sent'
  | 'sms_received'
  | 'sms_opted_out'
  | 'sms_opted_in'
  | 'missed_call_received'
  | 'missed_call_text_back_sent'
  | 'task_created'
  | 'task_completed'
  | 'workflow_triggered'
  | 'workflow_failed';

export type ActivityActorId = string | 'system';

export type ActivityActorType = 'user' | 'system' | 'api_key' | 'mcp';

export type LogActivityInput = {
  workspaceId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  actorId: ActivityActorId;
  actorType?: ActivityActorType;
  contactId?: string;
  metadata?: Record<string, unknown>;
};

export type ActivityEntry = Omit<LogActivityInput, 'actorType' | 'metadata'> & {
  actorType: ActivityActorType;
  metadata: Record<string, unknown>;
  id: string;
  createdAt: Date;
};
