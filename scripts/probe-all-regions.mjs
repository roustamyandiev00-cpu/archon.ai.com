import pg from 'pg';
const { Client } = pg;

const projectRef = "hqeozmmlddvempancnao";
const password1 = "Privet007.@.@@";
const password2 = "gJ0Lb3k5TJIZ/iRmgJMP+IgWkOomhk46u5ywvSsU+DC7lPEbaGGb8tGp5oD4dS7BT1zXocfEj2RxyYVeoTeCyQ==";

const regions = [
  'eu-central-1', 'eu-central-2', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-northeast-1', 'sa-east-1'
];

async function probe() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    // We proberen alleen password1 eerst om tijd te besparen
    console.log(`📡 Probing ${host}...`);
    const client = new Client({
      host: host,
      port: 6543,
      user: `postgres.${projectRef}`,
      password: password1,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });
    
    try {
      await client.connect();
      console.log(`✅ SUCCESS IN REGION: ${region}`);
      await client.end();
      process.exit(0);
    } catch (err) {
      if (err.message.includes('password authentication failed')) {
         console.log(`✅ FOUND REGION ${region} BUT PASSWORD FAILED`);
         // try password 2
         const client2 = new Client({
            host: host,
            port: 6543,
            user: `postgres.${projectRef}`,
            password: password2,
            database: 'postgres',
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 3000
          });
          try {
            await client2.connect();
            console.log(`✅ SUCCESS IN REGION ${region} WITH PASSWORD 2`);
            await client2.end();
            process.exit(0);
          } catch (err2) {
            console.log(`❌ Region ${region} found but both passwords failed.`);
          }
      } else {
        // console.log(`❌ ${region}: ${err.message}`);
      }
    }
  }
}

probe();
