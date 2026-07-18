import { Injectable } from '@nestjs/common';
import { Temporal } from 'temporal-polyfill';

import {
  type SendPolicyInput,
  type SendPolicyResult,
} from 'src/modules/custom/messaging/messaging-compliance.types';
import { CustomerConfigService } from 'src/modules/custom/white-label/customer-config.service';

const OPT_OUT_KEYWORDS = new Set([
  'STOP',
  'STOPALL',
  'UNSUBSCRIBE',
  'CANCEL',
  'END',
  'QUIT',
]);

const OPT_IN_KEYWORDS = new Set(['START', 'UNSTOP']);

@Injectable()
export class MessagingComplianceService {
  constructor(private readonly customerConfigService: CustomerConfigService) {}

  classifySmsKeyword(messageBody: string): 'opt_out' | 'opt_in' | 'none' {
    const normalizedBody = messageBody.trim().toUpperCase();

    if (OPT_OUT_KEYWORDS.has(normalizedBody)) {
      return 'opt_out';
    }

    if (OPT_IN_KEYWORDS.has(normalizedBody)) {
      return 'opt_in';
    }

    return 'none';
  }

  evaluateSendPolicy(input: SendPolicyInput): SendPolicyResult {
    if (input.consent.doNotContact) {
      return { allowed: false, reason: 'Contact is marked Do Not Contact' };
    }

    if (input.consent.optedOutAt) {
      return { allowed: false, reason: 'Contact has opted out' };
    }

    if (input.isAutomated && !input.consent.hasConsent) {
      return {
        allowed: false,
        reason: `Missing ${input.consent.channel.toUpperCase()} consent`,
      };
    }

    if (input.isAutomated && this.isQuietHours(input.now ?? new Date())) {
      return { allowed: false, reason: 'Quiet hours are active' };
    }

    return { allowed: true };
  }

  private isQuietHours(now: Date): boolean {
    const config = this.customerConfigService.getConfig();

    if (!config.compliance.quietHours.enabled) {
      return false;
    }

    const currentTime = Temporal.Instant.from(now.toISOString())
      .toZonedDateTimeISO(config.brand.timezone)
      .toPlainTime();
    const currentMinutes = currentTime.hour * 60 + currentTime.minute;
    const startMinutes = this.toMinutes(config.compliance.quietHours.start);
    const endMinutes = this.toMinutes(config.compliance.quietHours.end);

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);

    return hours * 60 + minutes;
  }
}
