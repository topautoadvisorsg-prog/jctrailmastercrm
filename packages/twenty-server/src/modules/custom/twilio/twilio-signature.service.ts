import { createHmac, timingSafeEqual } from 'crypto';

import { Injectable } from '@nestjs/common';

@Injectable()
export class TwilioSignatureService {
  validateSignature(input: {
    authToken?: string;
    url: string;
    params: Record<string, string>;
    signature: string;
  }): boolean {
    if (!input.authToken || !input.signature) {
      return false;
    }

    const signedPayload =
      input.url +
      Object.keys(input.params)
        .sort()
        .map((key) => `${key}${input.params[key]}`)
        .join('');

    const expectedSignature = createHmac('sha1', input.authToken)
      .update(signedPayload)
      .digest('base64');

    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(input.signature);

    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }
}
