import { type FieldMetadataType } from 'twenty-shared/types';

export type WorkOrderSetupStatus = 'missing' | 'existing' | 'created';

export type WorkOrderSetupObject = {
  id: string | null;
  nameSingular: 'workOrder';
  namePlural: 'workOrders';
  labelSingular: 'Work Order';
  labelPlural: 'Work Orders';
  objectPath: '/objects/workOrders';
  status: WorkOrderSetupStatus;
};

export type WorkOrderSetupField = {
  name: string;
  label: string;
  type: FieldMetadataType;
  status: WorkOrderSetupStatus;
};

export type WorkOrderSetupResponse = {
  workspaceId: string;
  isReady: boolean;
  object: WorkOrderSetupObject;
  fields: WorkOrderSetupField[];
};
