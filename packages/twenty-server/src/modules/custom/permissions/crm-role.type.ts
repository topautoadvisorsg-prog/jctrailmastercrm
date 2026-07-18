export type CrmRole =
  | 'admin'
  | 'manager'
  | 'sales_rep'
  | 'field_tech'
  | 'viewer';

export type CrmPermission =
  | 'contacts:view'
  | 'contacts:edit'
  | 'deals:view'
  | 'deals:edit'
  | 'tasks:view'
  | 'tasks:edit'
  | 'messages:send'
  | 'settings:white_label'
  | 'users:manage'
  | 'reports:view';

export type PermissionSubject = {
  ownerId?: string | null;
  assignedRepId?: string | null;
};
