import { Module } from '@nestjs/common';

import { ActivityLogModule } from 'src/modules/custom/activity-log/activity-log.module';
import { CrmDashboardModule } from 'src/modules/custom/crm-dashboard/crm-dashboard.module';
import { MessagingComplianceModule } from 'src/modules/custom/messaging/messaging-compliance.module';
import { CrmPermissionsModule } from 'src/modules/custom/permissions/crm-permissions.module';
import { ProviderEventModule } from 'src/modules/custom/provider-events/provider-event.module';
import { TwilioIntegrationModule } from 'src/modules/custom/twilio/twilio-integration.module';
import { WhiteLabelModule } from 'src/modules/custom/white-label/white-label.module';

@Module({
  imports: [
    ActivityLogModule,
    CrmDashboardModule,
    WhiteLabelModule,
    CrmPermissionsModule,
    MessagingComplianceModule,
    ProviderEventModule,
    TwilioIntegrationModule,
  ],
  exports: [
    ActivityLogModule,
    CrmDashboardModule,
    WhiteLabelModule,
    CrmPermissionsModule,
    MessagingComplianceModule,
    ProviderEventModule,
    TwilioIntegrationModule,
  ],
})
export class CrmCustomModule {}
