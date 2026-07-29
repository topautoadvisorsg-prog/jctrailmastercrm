import { Module } from '@nestjs/common';

import { TokenModule } from 'src/engine/core-modules/auth/token/token.module';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { ObjectMetadataModule } from 'src/engine/metadata-modules/object-metadata/object-metadata.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';
import { WorkOrderMetadataController } from 'src/modules/custom/work-orders/work-order-metadata.controller';
import { WorkOrderMetadataService } from 'src/modules/custom/work-orders/work-order-metadata.service';

@Module({
  imports: [
    TokenModule,
    WorkspaceCacheStorageModule,
    ObjectMetadataModule,
    FieldMetadataModule,
    PermissionsModule,
  ],
  controllers: [WorkOrderMetadataController],
  providers: [JwtAuthGuard, WorkspaceAuthGuard, WorkOrderMetadataService],
  exports: [WorkOrderMetadataService],
})
export class WorkOrderMetadataModule {}
