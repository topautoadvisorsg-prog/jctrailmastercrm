// Supabase installs uuid-ossp (and other extensions) into an `extensions`
// schema, not `public`, unlike a vanilla Postgres install. Twenty's generated
// table DDL hardcodes `public.uuid_generate_v4()` as the default UUID
// generator, which fails on Supabase with:
//   error: function public.uuid_generate_v4() does not exist
// This creates a thin wrapper in `public` so Twenty's DDL works unmodified.
// Idempotent - safe to run on every deploy.
import pg from 'pg';

const { Client } = pg;

const connectionString = process.env.PG_DATABASE_URL;

if (!connectionString) {
  console.log(
    'PG_DATABASE_URL not set, skipping Supabase uuid_generate_v4 shim.',
  );
  process.exit(0);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  const extensionSchema = await client.query(
    "select extnamespace::regnamespace as schema from pg_extension where extname = 'uuid-ossp'",
  );

  if (extensionSchema.rows.length === 0) {
    console.log(
      'uuid-ossp extension not found, skipping Supabase uuid_generate_v4 shim.',
    );
  } else if (extensionSchema.rows[0].schema === 'public') {
    console.log(
      'uuid-ossp already installed in public schema, no shim needed.',
    );
  } else {
    const schema = extensionSchema.rows[0].schema;

    await client.query(
      `CREATE OR REPLACE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT ${schema}.uuid_generate_v4() $$`,
    );
    console.log(
      `Created public.uuid_generate_v4() shim delegating to ${schema}.uuid_generate_v4().`,
    );
  }
} finally {
  await client.end();
}
