import pg from 'pg';
const { Client } = pg;

const projectRef = "hqeozmmlddvempancnao";
const regions = [
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-2', 'eu-north-1',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'
];

async function probe() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    // console.log(`📡 Probing ${region}...`);
    const client = new Client({
      host: host,
      port: 6543,
      user: `postgres.${projectRef}`,
      password: 'test',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 1000
    });
    
    try {
      await client.connect();
    } catch (err) {
      if (err.message.includes('password authentication failed') || err.message.includes('role')) {
         console.log(`✅ TENANT FOUND IN REGION: ${region}`);
         process.exit(0);
      }
    }
  }
}

probe();
