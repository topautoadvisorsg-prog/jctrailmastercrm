import { MessagingComplianceService } from 'src/modules/custom/messaging/messaging-compliance.service';
import { type CustomerConfigService } from 'src/modules/custom/white-label/customer-config.service';

const customerConfigService = {
  getConfig: jest.fn(() => ({
    brand: {
      timezone: 'America/Tijuana',
    },
    compliance: {
      quietHours: {
        enabled: true,
        start: '20:00',
        end: '08:00',
      },
    },
  })),
} as unknown as CustomerConfigService;

describe('MessagingComplianceService', () => {
  const service = new MessagingComplianceService(customerConfigService);

  it('classifies exact SMS opt-out and opt-in keywords', () => {
    expect(service.classifySmsKeyword(' stop ')).toBe('opt_out');
    expect(service.classifySmsKeyword('UNSTOP')).toBe('opt_in');
    expect(service.classifySmsKeyword('please stop texting')).toBe('none');
  });

  it('blocks automated sends without channel consent', () => {
    expect(
      service.evaluateSendPolicy({
        consent: {
          channel: 'sms',
          hasConsent: false,
          doNotContact: false,
        },
        isAutomated: true,
      }),
    ).toEqual({
      allowed: false,
      reason: 'Missing SMS consent',
    });
  });

  it('blocks automated sends during configured quiet hours', () => {
    expect(
      service.evaluateSendPolicy({
        consent: {
          channel: 'sms',
          hasConsent: true,
          doNotContact: false,
        },
        isAutomated: true,
        now: new Date('2026-05-29T05:00:00.000Z'),
      }),
    ).toEqual({
      allowed: false,
      reason: 'Quiet hours are active',
    });
  });
});
