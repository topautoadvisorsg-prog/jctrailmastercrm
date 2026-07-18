import { type z } from 'zod';

import { type customerConfigSchema } from 'src/modules/custom/white-label/customer-config.schema';

export type CustomerConfig = z.infer<typeof customerConfigSchema>;
export type CustomerCurrency = CustomerConfig['brand']['currency'];
export type CustomerDateFormat = CustomerConfig['brand']['dateFormat'];
