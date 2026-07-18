import { Injectable, ServiceUnavailableException } from '@nestjs/common';

const REQUIRED_TWILIO_ENV_KEYS = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
] as const;

type TwilioEnvKey = (typeof REQUIRED_TWILIO_ENV_KEYS)[number];

export type SendSmsInput = {
  to: string;
  body: string;
  workspaceId: string;
  contactId?: string;
};

@Injectable()
export class TwilioClientService {
  isConfigured(): boolean {
    return this.getMissingConfigurationKeys().length === 0;
  }

  getMissingConfigurationKeys(): TwilioEnvKey[] {
    return REQUIRED_TWILIO_ENV_KEYS.filter(
      (envKey) => !this.getEnvironmentValue(envKey),
    );
  }

  isLiveSendApproved(): boolean {
    return process.env.TWILIO_LIVE_SENDS_APPROVED === 'true';
  }

  canSendLiveSms(): boolean {
    return this.isConfigured() && this.isLiveSendApproved();
  }

  async sendSms(_input: SendSmsInput): Promise<never> {
    throw new ServiceUnavailableException(
      'Twilio live sends are disabled until provider credentials and TWILIO_LIVE_SENDS_APPROVED=true are configured.',
    );
  }

  private getEnvironmentValue(envKey: TwilioEnvKey): string | undefined {
    const value = process.env[envKey]?.trim();

    return value === '' ? undefined : value;
  }
}
