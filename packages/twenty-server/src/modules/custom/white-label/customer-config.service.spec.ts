import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { CustomerConfigService } from 'src/modules/custom/white-label/customer-config.service';
import { type CustomerConfig } from 'src/modules/custom/white-label/customer-config.types';

const validCustomerConfig = {
  brand: {
    companyName: '21 CRM',
    logoLight: '',
    logoDark: '',
    primaryColor: '#6366F1',
    secondaryColor: '#22D3A5',
    customDomain: 'localhost',
    emailSender: 'noreply@example.com',
    smsSenderName: '21 CRM',
    timezone: 'America/Tijuana',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
  },
  business: {
    address: '',
    phone: '',
    reviewLinks: {
      google: '',
      yelp: '',
      facebook: '',
    },
  },
  modules: {
    messaging: true,
    invoicing: false,
  },
  pipeline: {
    stages: ['New Lead', 'Closed Won'],
  },
  jobs: {
    types: ['Inspection'],
  },
  automation: {
    missedCallTextBackEnabled: false,
    missedCallDelaySeconds: 60,
    reviewRequestEnabled: false,
    reviewRequestDelayHours: 2,
    reviewPlatform: 'google',
  },
  compliance: {
    quietHours: {
      enabled: true,
      start: '20:00',
      end: '08:00',
    },
    requireSmsConsentForAutomation: true,
    requireEmailConsentForAutomation: true,
  },
} satisfies CustomerConfig;

describe('CustomerConfigService', () => {
  const originalCustomerConfigPath = process.env.CUSTOMER_CONFIG_PATH;
  const tempDirectories: string[] = [];

  afterEach(() => {
    if (originalCustomerConfigPath === undefined) {
      delete process.env.CUSTOMER_CONFIG_PATH;
    } else {
      process.env.CUSTOMER_CONFIG_PATH = originalCustomerConfigPath;
    }

    for (const tempDirectory of tempDirectories.splice(0)) {
      rmSync(tempDirectory, { force: true, recursive: true });
    }
  });

  it('loads an explicit customer config path and exposes module flags', () => {
    const configPath = writeCustomerConfig(validCustomerConfig);

    process.env.CUSTOMER_CONFIG_PATH = configPath;

    const service = new CustomerConfigService();

    expect(service.getConfig()).toEqual(validCustomerConfig);
    expect(service.isModuleEnabled('messaging')).toBe(true);
    expect(service.isModuleEnabled('invoicing')).toBe(false);
    expect(service.isModuleEnabled('missing-module')).toBe(false);
  });

  it('fails with a clear path message when the explicit config file is missing', () => {
    const missingConfigPath = join(createTempDirectory(), 'missing.json');

    process.env.CUSTOMER_CONFIG_PATH = missingConfigPath;

    expect(() => new CustomerConfigService()).toThrow(
      `customer.config.json not found at ${missingConfigPath}`,
    );
  });

  it('fails with a clear message when the config is not valid JSON', () => {
    const configPath = writeRawCustomerConfig('{not-json');

    process.env.CUSTOMER_CONFIG_PATH = configPath;

    expect(() => new CustomerConfigService()).toThrow(
      `customer.config.json at ${configPath} must be valid JSON`,
    );
  });

  it('fails with field-level validation details for invalid customer config', () => {
    const configPath = writeCustomerConfig({
      ...validCustomerConfig,
      brand: {
        ...validCustomerConfig.brand,
        primaryColor: 'indigo',
        timezone: 'Mars/Base',
      },
    });

    process.env.CUSTOMER_CONFIG_PATH = configPath;

    expect(() => new CustomerConfigService()).toThrow(
      `customer.config.json at ${configPath} is invalid: brand.primaryColor: must be hex; brand.timezone: must be a valid timezone`,
    );
  });

  function writeCustomerConfig(config: unknown): string {
    return writeRawCustomerConfig(JSON.stringify(config));
  }

  function writeRawCustomerConfig(rawConfig: string): string {
    const tempDirectory = createTempDirectory();
    const configPath = join(tempDirectory, 'customer.config.json');

    writeFileSync(configPath, rawConfig);

    return configPath;
  }

  function createTempDirectory(): string {
    const tempDirectory = mkdtempSync(join(tmpdir(), '21-crm-config-'));

    tempDirectories.push(tempDirectory);

    return tempDirectory;
  }
});
