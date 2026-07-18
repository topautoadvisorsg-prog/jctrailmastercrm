import { Module } from '@nestjs/common';

import { CrmPermissionsService } from 'src/modules/custom/permissions/crm-permissions.service';

@Module({
  providers: [CrmPermissionsService],
  exports: [CrmPermissionsService],
})
export class CrmPermissionsModule {}
