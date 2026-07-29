import { Controller, Get, Post, UseGuards } from '@nestjs/common';

import { PermissionFlagType } from 'twenty-shared/constants';

import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { WorkOrderMetadataService } from 'src/modules/custom/work-orders/work-order-metadata.service';
import { type WorkOrderSetupResponse } from 'src/modules/custom/work-orders/work-order-metadata.types';

@Controller('rest/crm')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class WorkOrderMetadataController {
  constructor(
    private readonly workOrderMetadataService: WorkOrderMetadataService,
  ) {}

  @Get('work-orders-setup')
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.DATA_MODEL))
  async getSetupStatus(): Promise<WorkOrderSetupResponse> {
    return this.workOrderMetadataService.getSetupStatus(
      getWorkspaceAuthContext(),
    );
  }

  @Post('work-orders-setup')
  @UseGuards(SettingsPermissionGuard(PermissionFlagType.DATA_MODEL))
  async ensureSetup(): Promise<WorkOrderSetupResponse> {
    return this.workOrderMetadataService.ensureSetup(getWorkspaceAuthContext());
  }
}
