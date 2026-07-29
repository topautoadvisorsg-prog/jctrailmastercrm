const DEFAULT_PG_POOL_MAX_CONNECTIONS = 10;

export const getDatabasePoolSize = (): number => {
  const poolSize = Number(
    process.env.PG_POOL_MAX_CONNECTIONS ?? DEFAULT_PG_POOL_MAX_CONNECTIONS,
  );

  return Number.isInteger(poolSize) && poolSize > 0
    ? poolSize
    : DEFAULT_PG_POOL_MAX_CONNECTIONS;
};
