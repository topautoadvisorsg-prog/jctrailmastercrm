import { Module } from '@nestjs/common';

import { MessagingComplianceService } from 'src/modules/custom/messaging/messaging-compliance.service';
import { WhiteLabelModule } from 'src/modules/custom/white-label/white-label.module';

@Module({
  imports: [WhiteLabelModule],
  providers: [MessagingComplianceService],
  exports: [MessagingComplianceService],
})
export class MessagingComplianceModule {}
