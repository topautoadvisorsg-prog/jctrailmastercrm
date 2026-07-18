import { Injectable } from '@nestjs/common';

import {
  type CrmPermission,
  type CrmRole,
  type PermissionSubject,
} from 'src/modules/custom/permissions/crm-role.type';

const ROLE_PERMISSIONS: Record<CrmRole, Set<CrmPermission>> = {
  admin: new Set([
    'contacts:view',
    'contacts:edit',
    'deals:view',
    'deals:edit',
    'tasks:view',
    'tasks:edit',
    'messages:send',
    'settings:white_label',
    'users:manage',
    'reports:view',
  ]),
  manager: new Set([
    'contacts:view',
    'contacts:edit',
    'deals:view',
    'deals:edit',
    'tasks:view',
    'tasks:edit',
    'messages:send',
    'reports:view',
  ]),
  sales_rep: new Set([
    'contacts:view',
    'contacts:edit',
    'deals:view',
    'deals:edit',
    'tasks:view',
    'tasks:edit',
    'messages:send',
    'reports:view',
  ]),
  field_tech: new Set([
    'contacts:view',
    'contacts:edit',
    'tasks:view',
    'tasks:edit',
  ]),
  viewer: new Set(['contacts:view', 'deals:view', 'reports:view']),
};

@Injectable()
export class CrmPermissionsService {
  hasPermission(role: CrmRole, permission: CrmPermission): boolean {
    return ROLE_PERMISSIONS[role].has(permission);
  }

  canAccessOwnedRecord(input: {
    role: CrmRole;
    userId: string;
    subject: PermissionSubject;
  }): boolean {
    if (input.role === 'admin' || input.role === 'manager') {
      return true;
    }

    return (
      input.subject.ownerId === input.userId ||
      input.subject.assignedRepId === input.userId
    );
  }
}
