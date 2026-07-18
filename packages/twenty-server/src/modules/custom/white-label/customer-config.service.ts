import { existsSync, readFileSync } from 'fs';
import { isAbsolute, resolve } from 'path';

import { Injectable } from '@nestjs/common';

import { customerConfigSchema } from 'src/modules/custom/white-label/customer-config.schema';
import { type CustomerConfig } from 'src/modules/custom/white-label/customer-config.types';

@Injectable()
export class CustomerConfigService {
  private readonly config: CustomerConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig(this.config);
  }

  getConfig(): CustomerConfig {
    return this.config;
  }

  isModuleEnabled(moduleName: string): boolean {
    return this.config.modules[moduleName] === true;
  }

  private loadConfig(): CustomerConfig {
    const configPath = this.resolveConfigPath();
    const rawConfig = this.readConfigFile(configPath);
    const parsedConfig = this.parseConfig(rawConfig, configPath);

    return this.validateConfig(parsedConfig, configPath);
  }

  private resolveConfigPath(): string {
    if (process.env.CUSTOMER_CONFIG_PATH) {
      return isAbsolute(process.env.CUSTOMER_CONFIG_PATH)
        ? process.env.CUSTOMER_CONFIG_PATH
        : resolve(process.cwd(), process.env.CUSTOMER_CONFIG_PATH);
    }

    const candidatePaths = [
      resolve(process.cwd(), 'customer.config.json'),
      resolve(process.cwd(), '../../customer.config.json'),
    ];

    const configPath = candidatePaths.find((path) => existsSync(path));

    if (!configPath) {
      throw new Error(
        `customer.config.json not found. Checked: ${candidatePaths.join(', ')}`,
      );
    }

    return configPath;
  }

  private readConfigFile(configPath: string): string {
    if (!existsSync(configPath)) {
      throw new Error(`customer.config.json not found at ${configPath}`);
    }

    return readFileSync(configPath, 'utf8');
  }

  private parseConfig(rawConfig: string, configPath: string): unknown {
    try {
      return JSON.parse(rawConfig);
    } catch {
      throw new Error(
        `customer.config.json at ${configPath} must be valid JSON`,
      );
    }
  }

  private validateConfig(config: unknown, configPath: string): CustomerConfig {
    const validationResult = customerConfigSchema.safeParse(config);

    if (!validationResult.success) {
      const issues = validationResult.error.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ');

      throw new Error(
        `customer.config.json at ${configPath} is invalid: ${issues}`,
      );
    }

    return validationResult.data;
  }
}
