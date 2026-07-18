import { Module } from '@nestjs/common';

import { TwilioClientService } from 'src/modules/custom/twilio/twilio-client.service';
import { TwilioSignatureService } from 'src/modules/custom/twilio/twilio-signature.service';

@Module({
  providers: [TwilioClientService, TwilioSignatureService],
  exports: [TwilioClientService, TwilioSignatureService],
})
export class TwilioIntegrationModule {}
