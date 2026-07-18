import { Module } from '@nestjs/common';

import { CustomerConfigService } from 'src/modules/custom/white-label/customer-config.service';

@Module({
  providers: [CustomerConfigService],
  exports: [CustomerConfigService],
})
export class WhiteLabelModule {}
