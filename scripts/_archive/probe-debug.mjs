import pg from 'pg';
const { Client } = pg;

const projectRef = "hqeozmmlddvempancnao";
const password1 = "Privet007.@.@@";

const regions = [
  'eu-central-1', 'eu-central-2', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'
];

async function probe() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`📡 Probing ${host}...`);
    const client = new Client({
      host: host,
      port: 6543,
      user: `postgres.${projectRef}`,
      password: password1,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 2000
    });
    
    try {
      await client.connect();
      console.log(`✅ SUCCESS IN REGION: ${region}`);
      await client.end();
      process.exit(0);
    } catch (err) {
       console.log(`❌ ${region}: ${err.message}`);
    }
  }
}

probe();
