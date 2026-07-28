import { Module } from '@nestjs/common';

import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { GlobalWorkspaceDataSourceModule } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { CrmDashboardController } from 'src/modules/custom/crm-dashboard/crm-dashboard.controller';
import { CrmDashboardService } from 'src/modules/custom/crm-dashboard/crm-dashboard.service';

@Module({
  imports: [
    GlobalWorkspaceDataSourceModule,
    TokenModule,
    WorkspaceCacheStorageModule,
  ],
  controllers: [CrmDashboardController],
  providers: [
    JwtAuthGuard,
    WorkspaceAuthGuard,
    NoPermissionGuard,
    CrmDashboardService,
  ],
  exports: [CrmDashboardService],
})
export class CrmDashboardModule {}
