import { createHmac } from 'crypto';

import { TwilioSignatureService } from 'src/modules/custom/twilio/twilio-signature.service';

describe('TwilioSignatureService', () => {
  const service = new TwilioSignatureService();

  it('validates Twilio signatures with sorted form params', () => {
    const authToken = 'test-token';
    const url = 'https://crm.example.com/webhooks/twilio';
    const params = {
      From: '+15555550100',
      Body: 'Hello',
      MessageSid: 'SM123',
    };
    const signedPayload = `${url}BodyHelloFrom+15555550100MessageSidSM123`;
    const signature = createHmac('sha1', authToken)
      .update(signedPayload)
      .digest('base64');

    expect(
      service.validateSignature({
        authToken,
        url,
        params,
        signature,
      }),
    ).toBe(true);
  });

  it('rejects missing or mismatched signatures', () => {
    expect(
      service.validateSignature({
        authToken: 'test-token',
        url: 'https://crm.example.com/webhooks/twilio',
        params: {},
        signature: 'wrong',
      }),
    ).toBe(false);
  });
});
