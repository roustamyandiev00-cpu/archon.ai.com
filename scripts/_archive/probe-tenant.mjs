import pg from 'pg';
const { Client } = pg;

const projectRef = "hqeozmmlddvempancnao";
const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'af-south-1', 'ap-east-1', 'ap-south-1', 'ap-northeast-3', 'ap-northeast-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ca-central-1',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-south-1', 'eu-west-3',
  'eu-north-1', 'me-south-1', 'sa-east-1', 'eu-central-2', 'eu-south-2'
];

async function probe() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`📡 Probing ${region}...`);
    const client = new Client({
      host: host,
      port: 6543,
      user: `postgres.${projectRef}`,
      password: 'test', // We care if it says "password failed" vs "tenant not found"
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 2000
    });
    
    try {
      await client.connect();
    } catch (err) {
      if (!err.message.includes('Tenant or user not found')) {
         console.log(`✅ FOUND REGION: ${region}`);
         console.log(`Message: ${err.message}`);
         process.exit(0);
      }
    }
  }
}

probe();
