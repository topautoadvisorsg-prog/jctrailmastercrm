import { getDatabasePoolSize } from 'src/database/typeorm/utils/get-database-pool-size.util';

const originalPoolSize = process.env.PG_POOL_MAX_CONNECTIONS;

describe('getDatabasePoolSize', () => {
  afterEach(() => {
    process.env.PG_POOL_MAX_CONNECTIONS = originalPoolSize;
  });

  it('uses the default pool size when PG_POOL_MAX_CONNECTIONS is unset', () => {
    delete process.env.PG_POOL_MAX_CONNECTIONS;

    expect(getDatabasePoolSize()).toBe(10);
  });

  it('uses a positive integer PG_POOL_MAX_CONNECTIONS value', () => {
    process.env.PG_POOL_MAX_CONNECTIONS = '5';

    expect(getDatabasePoolSize()).toBe(5);
  });

  it.each(['0', '-1', 'abc', '2.5'])(
    'falls back to the default pool size for invalid value %s',
    (invalidValue) => {
      process.env.PG_POOL_MAX_CONNECTIONS = invalidValue;

      expect(getDatabasePoolSize()).toBe(10);
    },
  );
});
