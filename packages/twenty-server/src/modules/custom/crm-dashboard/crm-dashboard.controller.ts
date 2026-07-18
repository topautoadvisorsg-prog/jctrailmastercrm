import { Controller, Get, UseGuards } from '@nestjs/common';

import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { CrmDashboardService } from 'src/modules/custom/crm-dashboard/crm-dashboard.service';
import { type CrmDashboardResponse } from 'src/modules/custom/crm-dashboard/crm-dashboard.types';

@Controller('rest/crm')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, NoPermissionGuard)
export class CrmDashboardController {
  constructor(private readonly crmDashboardService: CrmDashboardService) {}

  @Get('dashboard')
  async getDashboard(): Promise<CrmDashboardResponse> {
    return this.crmDashboardService.getDashboard(getWorkspaceAuthContext());
  }
}
