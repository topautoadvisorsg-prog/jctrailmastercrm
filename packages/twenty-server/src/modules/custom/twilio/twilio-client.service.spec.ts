import { ServiceUnavailableException } from '@nestjs/common';

import { TwilioClientService } from 'src/modules/custom/twilio/twilio-client.service';

const TWILIO_ENV_KEYS = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
  'TWILIO_LIVE_SENDS_APPROVED',
] as const;

describe('TwilioClientService', () => {
  const originalEnvValues = TWILIO_ENV_KEYS.reduce<
    Partial<Record<(typeof TWILIO_ENV_KEYS)[number], string>>
  >((envValues, envKey) => {
    envValues[envKey] = process.env[envKey];

    return envValues;
  }, {});

  afterEach(() => {
    for (const envKey of TWILIO_ENV_KEYS) {
      const originalValue = originalEnvValues[envKey];

      if (originalValue === undefined) {
        delete process.env[envKey];
      } else {
        process.env[envKey] = originalValue;
      }
    }
  });

  it('treats missing and whitespace Twilio credentials as unconfigured', () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = '   ';
    process.env.TWILIO_FROM_NUMBER = '';

    const service = new TwilioClientService();

    expect(service.isConfigured()).toBe(false);
    expect(service.getMissingConfigurationKeys()).toEqual([
      'TWILIO_AUTH_TOKEN',
      'TWILIO_FROM_NUMBER',
    ]);
    expect(service.canSendLiveSms()).toBe(false);
  });

  it('requires explicit live-send approval in addition to credentials', () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_FROM_NUMBER = '+15555550100';

    const service = new TwilioClientService();

    expect(service.isConfigured()).toBe(true);
    expect(service.getMissingConfigurationKeys()).toEqual([]);
    expect(service.canSendLiveSms()).toBe(false);

    process.env.TWILIO_LIVE_SENDS_APPROVED = 'true';

    expect(service.canSendLiveSms()).toBe(true);
  });

  it('keeps live SMS sends disabled until the provider implementation is approved', async () => {
    const service = new TwilioClientService();

    await expect(
      service.sendSms({
        to: '+15555550100',
        body: 'Hello',
        workspaceId: 'workspace-id',
      }),
    ).rejects.toThrow(ServiceUnavailableException);

    await expect(
      service.sendSms({
        to: '+15555550100',
        body: 'Hello',
        workspaceId: 'workspace-id',
      }),
    ).rejects.toThrow(
      'Twilio live sends are disabled until provider credentials and TWILIO_LIVE_SENDS_APPROVED=true are configured.',
    );
  });
});
