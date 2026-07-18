import { Module } from '@nestjs/common';

import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { CrmDashboardController } from 'src/modules/custom/crm-dashboard/crm-dashboard.controller';
import { CrmDashboardService } from 'src/modules/custom/crm-dashboard/crm-dashboard.service';

@Module({
  imports: [GlobalWorkspaceDataSourceModule],
  controllers: [CrmDashboardController],
  providers: [CrmDashboardService],
  exports: [CrmDashboardService],
})
export class CrmDashboardModule {}
