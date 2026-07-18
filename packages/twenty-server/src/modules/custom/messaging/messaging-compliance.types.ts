export type CommunicationChannel = 'sms' | 'email';

export type ConsentState = {
  channel: CommunicationChannel;
  hasConsent: boolean;
  optedOutAt?: Date | null;
  doNotContact: boolean;
};

export type SendPolicyInput = {
  consent: ConsentState;
  isAutomated: boolean;
  now?: Date;
};

export type SendPolicyResult = {
  allowed: boolean;
  reason?: string;
};
