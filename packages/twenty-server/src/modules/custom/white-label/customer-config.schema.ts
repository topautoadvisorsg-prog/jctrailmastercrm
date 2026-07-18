import { z } from 'zod';

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const nonEmptyStringSchema = z.string().trim().min(1, 'is required');
const hexColorSchema = z.string().regex(HEX_COLOR_PATTERN, 'must be hex');
const quietHourTimeSchema = z
  .string()
  .regex(TIME_PATTERN, 'must use HH:mm format');

export const customerConfigSchema = z
  .object({
    brand: z
      .object({
        companyName: nonEmptyStringSchema,
        logoLight: z.string(),
        logoDark: z.string(),
        primaryColor: hexColorSchema,
        secondaryColor: hexColorSchema,
        customDomain: z.string(),
        emailSender: z.string(),
        smsSenderName: z.string(),
        timezone: z
          .string()
          .refine(isValidTimeZone, 'must be a valid timezone'),
        currency: z.enum(['USD', 'CAD', 'GBP', 'EUR', 'MXN']),
        dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY']),
      })
      .strict(),
    business: z
      .object({
        address: z.string(),
        phone: z.string(),
        reviewLinks: z
          .object({
            google: z.string(),
            yelp: z.string(),
            facebook: z.string(),
          })
          .strict(),
      })
      .strict(),
    modules: z.record(z.string(), z.boolean()),
    pipeline: z
      .object({
        stages: z
          .array(nonEmptyStringSchema)
          .min(2, 'pipeline.stages needs 2+ stages'),
      })
      .strict(),
    jobs: z
      .object({
        types: z.array(nonEmptyStringSchema).min(1, 'jobs.types is required'),
      })
      .strict(),
    automation: z
      .object({
        missedCallTextBackEnabled: z.boolean(),
        missedCallDelaySeconds: z
          .number()
          .int('must be an integer')
          .min(0, 'cannot be negative'),
        reviewRequestEnabled: z.boolean(),
        reviewRequestDelayHours: z
          .number()
          .int('must be an integer')
          .min(0, 'cannot be negative'),
        reviewPlatform: z.enum(['google', 'yelp', 'facebook']),
      })
      .strict(),
    compliance: z
      .object({
        quietHours: z
          .object({
            enabled: z.boolean(),
            start: quietHourTimeSchema,
            end: quietHourTimeSchema,
          })
          .strict(),
        requireSmsConsentForAutomation: z.boolean(),
        requireEmailConsentForAutomation: z.boolean(),
      })
      .strict(),
  })
  .strict();

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });

    return true;
  } catch {
    return false;
  }
}
