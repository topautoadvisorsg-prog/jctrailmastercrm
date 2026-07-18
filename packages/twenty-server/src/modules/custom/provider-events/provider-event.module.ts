import { Module } from '@nestjs/common';

import { ProviderEventService } from 'src/modules/custom/provider-events/provider-event.service';

@Module({
  providers: [ProviderEventService],
  exports: [ProviderEventService],
})
export class ProviderEventModule {}
