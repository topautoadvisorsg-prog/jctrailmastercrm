import { AppPath } from 'twenty-shared/types';
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconCalendar,
  IconMessage,
  IconPhone,
  IconTool,
  IconUsers,
  type IconComponent,
} from 'twenty-ui/display';

export type CrmModuleKey =
  | 'contacts'
  | 'companies'
  | 'deals'
  | 'tasks'
  | 'workOrders';

export type CrmModuleConfig = {
  key: CrmModuleKey;
  label: string;
  title: string;
  description: string;
  objectPath: string;
  metricKey: CrmModuleKey;
  Icon: IconComponent;
  primaryActions: Array<{
    label: string;
    description: string;
    to: string;
    Icon: IconComponent;
  }>;
  operatingChecklist: Array<{
    label: string;
    state: string;
  }>;
  focusAreas: Array<{
    label: string;
    description: string;
  }>;
};

export const crmModuleConfigs: Record<CrmModuleKey, CrmModuleConfig> = {
  contacts: {
    key: 'contacts',
    label: 'Contacts',
    title: 'Contact command center',
    description:
      'Review people records, consent readiness, ownership, and follow-up context before communications are enabled.',
    objectPath: AppPath.PeoplePage,
    metricKey: 'contacts',
    Icon: IconUsers,
    primaryActions: [
      {
        label: 'Open contact records',
        description: 'Use the Twenty people table with saved views and fields.',
        to: AppPath.PeoplePage,
        Icon: IconUsers,
      },
      {
        label: 'Review communication readiness',
        description:
          'Provider keys stay disabled until consent checks are live.',
        to: AppPath.CrmDashboard,
        Icon: IconMessage,
      },
    ],
    operatingChecklist: [
      { label: 'Consent storage', state: 'Guardrails ready' },
      { label: 'STOP handling', state: 'Provider keys pending' },
      { label: 'Owner assignment', state: 'Use Twenty people fields' },
    ],
    focusAreas: [
      {
        label: 'Consent before outreach',
        description:
          'Confirm opt-in status before enabling any SMS or email automation.',
      },
      {
        label: 'Ownership clarity',
        description:
          'Keep every active contact assigned so follow-up work has a clear owner.',
      },
      {
        label: 'Recent touchpoints',
        description:
          'Use activity history to avoid duplicate calls and stale promises.',
      },
    ],
  },
  companies: {
    key: 'companies',
    label: 'Companies',
    title: 'Company command center',
    description:
      'Manage accounts, relationships, linked contacts, and service context without leaving the Twenty object model.',
    objectPath: AppPath.CompaniesPage,
    metricKey: 'companies',
    Icon: IconBuildingSkyscraper,
    primaryActions: [
      {
        label: 'Open company records',
        description: 'Use account lists, filters, and record details.',
        to: AppPath.CompaniesPage,
        Icon: IconBuildingSkyscraper,
      },
      {
        label: 'View related contacts',
        description: 'Jump to contact records for account mapping.',
        to: AppPath.CrmContacts,
        Icon: IconUsers,
      },
    ],
    operatingChecklist: [
      { label: 'Account history', state: 'Activity log ready' },
      { label: 'Linked contacts', state: 'Twenty relation fields' },
      { label: 'Service context', state: 'V1.1 workflow expansion' },
    ],
    focusAreas: [
      {
        label: 'Decision makers',
        description:
          'Keep primary contacts attached to each account for clean handoffs.',
      },
      {
        label: 'Account health',
        description:
          'Review stale companies with no recent activity before pipeline reviews.',
      },
      {
        label: 'Service context',
        description:
          'Capture notes that sales, service, and billing can all understand.',
      },
    ],
  },
  deals: {
    key: 'deals',
    label: 'Deals',
    title: 'Deal command center',
    description:
      'Track open opportunities, pipeline movement, owner follow-up, and close priorities from the CRM workspace.',
    objectPath: AppPath.OpportunitiesPage,
    metricKey: 'deals',
    Icon: IconBriefcase,
    primaryActions: [
      {
        label: 'Open deal records',
        description: 'Use the opportunity pipeline and table views.',
        to: AppPath.OpportunitiesPage,
        Icon: IconBriefcase,
      },
      {
        label: 'Review follow-up tasks',
        description: 'Use task records to keep promises visible.',
        to: AppPath.CrmTasks,
        Icon: IconCalendar,
      },
    ],
    operatingChecklist: [
      { label: 'Pipeline stages', state: 'Twenty opportunity fields' },
      { label: 'Close-date review', state: 'Object filters ready' },
      { label: 'Automation nudges', state: 'Deferred until workflow phase' },
    ],
    focusAreas: [
      {
        label: 'Stage hygiene',
        description:
          'Keep stage movement current so reporting does not drift from reality.',
      },
      {
        label: 'Close-date risk',
        description:
          'Review deals with overdue or missing close dates during pipeline review.',
      },
      {
        label: 'Next action',
        description:
          'Every active deal should have a task or clear owner follow-up.',
      },
    ],
  },
  tasks: {
    key: 'tasks',
    label: 'Tasks',
    title: 'Task command center',
    description:
      'Keep calls, visits, reminders, and promises visible while provider automations remain safely disabled.',
    objectPath: AppPath.TasksPage,
    metricKey: 'tasks',
    Icon: IconCalendar,
    primaryActions: [
      {
        label: 'Open task records',
        description: 'Use Twenty task views for ownership and due dates.',
        to: AppPath.TasksPage,
        Icon: IconCalendar,
      },
      {
        label: 'Review missed-call readiness',
        description: 'Confirm provider placeholders before enabling SMS.',
        to: AppPath.CrmDashboard,
        Icon: IconPhone,
      },
    ],
    operatingChecklist: [
      { label: 'Due-date tracking', state: 'Twenty task fields' },
      { label: 'Missed-call tasks', state: 'Provider keys pending' },
      { label: 'Background jobs', state: 'Backend deployment required' },
    ],
    focusAreas: [
      {
        label: 'Today first',
        description:
          'Prioritize due and overdue work before starting new outreach.',
      },
      {
        label: 'Promise tracking',
        description:
          'Turn customer commitments into dated tasks instead of loose notes.',
      },
      {
        label: 'Automation readiness',
        description:
          'Missed-call task creation stays disabled until provider webhooks are live.',
      },
    ],
  },
  workOrders: {
    key: 'workOrders',
    label: 'Work Orders',
    title: 'Work order command center',
    description:
      'Turn calls and leads into scheduled service work before estimates and invoices.',
    objectPath: AppPath.WorkOrdersPage,
    metricKey: 'workOrders',
    Icon: IconTool,
    primaryActions: [
      {
        label: 'Open work order records',
        description:
          'Use the Twenty Work Orders object for intake, scheduling, ownership, and status.',
        to: AppPath.WorkOrdersPage,
        Icon: IconTool,
      },
      {
        label: 'Review related tasks',
        description: 'Use tasks for follow-up promises and dispatch reminders.',
        to: AppPath.CrmTasks,
        Icon: IconCalendar,
      },
    ],
    operatingChecklist: [
      { label: 'Data model', state: 'Admin setup endpoint ready' },
      { label: 'Customer linkage', state: 'Person/company/deal relations' },
      { label: 'Estimate handoff', state: 'Next phase' },
    ],
    focusAreas: [
      {
        label: 'Structured intake',
        description:
          'Capture service type, priority, source, description, and service address at the first touch.',
      },
      {
        label: 'Scheduling readiness',
        description:
          'Use planned start and end times so dispatch can become a real calendar workflow.',
      },
      {
        label: 'Estimate bridge',
        description:
          'Keep early service value on the work order until formal estimates and invoices are built.',
      },
    ],
  },
};
