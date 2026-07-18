import { Module } from '@nestjs/common';

import { ActivityLogService } from 'src/modules/custom/activity-log/activity-log.service';

@Module({
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
