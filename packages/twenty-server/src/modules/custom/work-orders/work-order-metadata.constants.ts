import { FieldMetadataType, RelationType } from 'twenty-shared/types';

export const WORK_ORDER_OBJECT = {
  nameSingular: 'workOrder',
  namePlural: 'workOrders',
  labelSingular: 'Work Order',
  labelPlural: 'Work Orders',
  description: 'A service work order for customer jobs and repair requests',
  icon: 'IconTool',
  color: 'orange',
  objectPath: '/objects/workOrders',
} as const;

type WorkOrderFieldOption = {
  id: string;
  value: string;
  label: string;
  position: number;
  color: string;
};

export type WorkOrderFieldDefinition = {
  name: string;
  label: string;
  description: string;
  icon: string;
  type: FieldMetadataType;
  isNullable: boolean;
  defaultValue?: unknown;
  options?: WorkOrderFieldOption[];
  relation?: {
    type: RelationType;
    targetObjectName: string;
    targetFieldLabel: string;
    targetFieldIcon: string;
  };
};

export const WORK_ORDER_FIELD_DEFINITIONS: WorkOrderFieldDefinition[] = [
  {
    type: FieldMetadataType.SELECT,
    name: 'status',
    label: 'Status',
    description: 'Current work order status',
    icon: 'IconProgressCheck',
    isNullable: false,
    defaultValue: "'NEW'",
    options: [
      {
        id: '20260729-1001-4000-8000-000000000001',
        value: 'NEW',
        label: 'New',
        position: 0,
        color: 'sky',
      },
      {
        id: '20260729-1002-4000-8000-000000000002',
        value: 'SCHEDULED',
        label: 'Scheduled',
        position: 1,
        color: 'purple',
      },
      {
        id: '20260729-1003-4000-8000-000000000003',
        value: 'IN_PROGRESS',
        label: 'In Progress',
        position: 2,
        color: 'yellow',
      },
      {
        id: '20260729-1004-4000-8000-000000000004',
        value: 'WAITING_ON_PARTS',
        label: 'Waiting on Parts',
        position: 3,
        color: 'orange',
      },
      {
        id: '20260729-1005-4000-8000-000000000005',
        value: 'COMPLETED',
        label: 'Completed',
        position: 4,
        color: 'green',
      },
      {
        id: '20260729-1006-4000-8000-000000000006',
        value: 'CANCELLED',
        label: 'Cancelled',
        position: 5,
        color: 'gray',
      },
    ],
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'priority',
    label: 'Priority',
    description: 'Dispatch and follow-up priority',
    icon: 'IconAlertTriangle',
    isNullable: false,
    defaultValue: "'NORMAL'",
    options: [
      {
        id: '20260729-1101-4000-8000-000000000001',
        value: 'LOW',
        label: 'Low',
        position: 0,
        color: 'gray',
      },
      {
        id: '20260729-1102-4000-8000-000000000002',
        value: 'NORMAL',
        label: 'Normal',
        position: 1,
        color: 'sky',
      },
      {
        id: '20260729-1103-4000-8000-000000000003',
        value: 'HIGH',
        label: 'High',
        position: 2,
        color: 'orange',
      },
      {
        id: '20260729-1104-4000-8000-000000000004',
        value: 'URGENT',
        label: 'Urgent',
        position: 3,
        color: 'red',
      },
    ],
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'serviceType',
    label: 'Service Type',
    description: 'Type of customer service request',
    icon: 'IconTool',
    isNullable: true,
    options: [
      {
        id: '20260729-1201-4000-8000-000000000001',
        value: 'INSPECTION',
        label: 'Inspection',
        position: 0,
        color: 'sky',
      },
      {
        id: '20260729-1202-4000-8000-000000000002',
        value: 'INSTALLATION',
        label: 'Installation',
        position: 1,
        color: 'purple',
      },
      {
        id: '20260729-1203-4000-8000-000000000003',
        value: 'REPAIR',
        label: 'Repair',
        position: 2,
        color: 'orange',
      },
      {
        id: '20260729-1204-4000-8000-000000000004',
        value: 'MAINTENANCE',
        label: 'Maintenance',
        position: 3,
        color: 'green',
      },
      {
        id: '20260729-1205-4000-8000-000000000005',
        value: 'QUOTE',
        label: 'Quote',
        position: 4,
        color: 'yellow',
      },
      {
        id: '20260729-1206-4000-8000-000000000006',
        value: 'OTHER',
        label: 'Other',
        position: 5,
        color: 'gray',
      },
    ],
  },
  {
    type: FieldMetadataType.SELECT,
    name: 'source',
    label: 'Source',
    description: 'How this work order entered the CRM',
    icon: 'IconRoute',
    isNullable: false,
    defaultValue: "'MANUAL'",
    options: [
      {
        id: '20260729-1301-4000-8000-000000000001',
        value: 'MANUAL',
        label: 'Manual',
        position: 0,
        color: 'gray',
      },
      {
        id: '20260729-1302-4000-8000-000000000002',
        value: 'PHONE',
        label: 'Phone',
        position: 1,
        color: 'sky',
      },
      {
        id: '20260729-1303-4000-8000-000000000003',
        value: 'WEBSITE',
        label: 'Website',
        position: 2,
        color: 'purple',
      },
      {
        id: '20260729-1304-4000-8000-000000000004',
        value: 'MISSED_CALL',
        label: 'Missed Call',
        position: 3,
        color: 'orange',
      },
      {
        id: '20260729-1305-4000-8000-000000000005',
        value: 'AI_RECEPTIONIST',
        label: 'AI Receptionist',
        position: 4,
        color: 'green',
      },
    ],
  },
  {
    type: FieldMetadataType.RICH_TEXT,
    name: 'description',
    label: 'Description',
    description: 'Customer request and service details',
    icon: 'IconFileText',
    isNullable: true,
  },
  {
    type: FieldMetadataType.ADDRESS,
    name: 'serviceAddress',
    label: 'Service Address',
    description: 'Location for the work order',
    icon: 'IconMapPin',
    isNullable: true,
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'scheduledStartAt',
    label: 'Scheduled Start',
    description: 'Planned service start time',
    icon: 'IconCalendarEvent',
    isNullable: true,
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'scheduledEndAt',
    label: 'Scheduled End',
    description: 'Planned service end time',
    icon: 'IconCalendarTime',
    isNullable: true,
  },
  {
    type: FieldMetadataType.DATE_TIME,
    name: 'completedAt',
    label: 'Completed At',
    description: 'Completion timestamp for the work order',
    icon: 'IconCircleCheck',
    isNullable: true,
  },
  {
    type: FieldMetadataType.CURRENCY,
    name: 'estimatedAmount',
    label: 'Estimated Amount',
    description: 'Early estimate amount before formal estimate/invoice modules',
    icon: 'IconCurrencyDollar',
    isNullable: true,
  },
  {
    type: FieldMetadataType.RELATION,
    name: 'customer',
    label: 'Customer',
    description: 'Primary customer for the work order',
    icon: 'IconUser',
    isNullable: true,
    relation: {
      type: RelationType.MANY_TO_ONE,
      targetObjectName: 'person',
      targetFieldLabel: 'Work Orders',
      targetFieldIcon: 'IconTool',
    },
  },
  {
    type: FieldMetadataType.RELATION,
    name: 'company',
    label: 'Company',
    description: 'Related company or account',
    icon: 'IconBuildingSkyscraper',
    isNullable: true,
    relation: {
      type: RelationType.MANY_TO_ONE,
      targetObjectName: 'company',
      targetFieldLabel: 'Work Orders',
      targetFieldIcon: 'IconTool',
    },
  },
  {
    type: FieldMetadataType.RELATION,
    name: 'opportunity',
    label: 'Opportunity',
    description: 'Related deal or lead opportunity',
    icon: 'IconTargetArrow',
    isNullable: true,
    relation: {
      type: RelationType.MANY_TO_ONE,
      targetObjectName: 'opportunity',
      targetFieldLabel: 'Work Orders',
      targetFieldIcon: 'IconTool',
    },
  },
  {
    type: FieldMetadataType.RELATION,
    name: 'assignedTechnician',
    label: 'Assigned Technician',
    description: 'Workspace member assigned to perform the work',
    icon: 'IconUserCircle',
    isNullable: true,
    relation: {
      type: RelationType.MANY_TO_ONE,
      targetObjectName: 'workspaceMember',
      targetFieldLabel: 'Assigned Work Orders',
      targetFieldIcon: 'IconTool',
    },
  },
];
