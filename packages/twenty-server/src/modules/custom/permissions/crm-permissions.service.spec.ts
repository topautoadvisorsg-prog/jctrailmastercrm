import { CrmPermissionsService } from 'src/modules/custom/permissions/crm-permissions.service';

describe('CrmPermissionsService', () => {
  let service: CrmPermissionsService;

  beforeEach(() => {
    service = new CrmPermissionsService();
  });

  describe('hasPermission', () => {
    it('grants admin every defined permission', () => {
      expect(service.hasPermission('admin', 'users:manage')).toBe(true);
      expect(service.hasPermission('admin', 'settings:white_label')).toBe(
        true,
      );
    });

    it('denies field_tech access to deals', () => {
      expect(service.hasPermission('field_tech', 'deals:view')).toBe(false);
      expect(service.hasPermission('field_tech', 'deals:edit')).toBe(false);
    });

    it('allows field_tech to view and edit tasks and contacts', () => {
      expect(service.hasPermission('field_tech', 'tasks:edit')).toBe(true);
      expect(service.hasPermission('field_tech', 'contacts:edit')).toBe(true);
    });

    it('restricts viewer to read-only permissions', () => {
      expect(service.hasPermission('viewer', 'contacts:view')).toBe(true);
      expect(service.hasPermission('viewer', 'contacts:edit')).toBe(false);
      expect(service.hasPermission('viewer', 'messages:send')).toBe(false);
    });
  });

  describe('canAccessOwnedRecord', () => {
    it('always allows admin and manager regardless of ownership', () => {
      expect(
        service.canAccessOwnedRecord({
          role: 'admin',
          userId: 'user-1',
          subject: { ownerId: 'someone-else' },
        }),
      ).toBe(true);
      expect(
        service.canAccessOwnedRecord({
          role: 'manager',
          userId: 'user-1',
          subject: { ownerId: 'someone-else' },
        }),
      ).toBe(true);
    });

    it('allows a sales_rep to access a record they own', () => {
      expect(
        service.canAccessOwnedRecord({
          role: 'sales_rep',
          userId: 'user-1',
          subject: { ownerId: 'user-1' },
        }),
      ).toBe(true);
    });

    it('allows a field_tech to access a record assigned to them', () => {
      expect(
        service.canAccessOwnedRecord({
          role: 'field_tech',
          userId: 'user-2',
          subject: { assignedRepId: 'user-2' },
        }),
      ).toBe(true);
    });

    it('denies access when the subject has no matching owner or assignee', () => {
      expect(
        service.canAccessOwnedRecord({
          role: 'sales_rep',
          userId: 'user-1',
          subject: { ownerId: 'someone-else', assignedRepId: 'another-one' },
        }),
      ).toBe(false);
    });
  });
});
