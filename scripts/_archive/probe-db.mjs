import pg from 'pg';
const { Client } = pg;

const projectRef = "hqeozmmlddvempancnao";
const password1 = "Privet007.@.@@";
const password2 = "gJ0Lb3k5TJIZ/iRmgJMP+IgWkOomhk46u5ywvSsU+DC7lPEbaGGb8tGp5oD4dS7BT1zXocfEj2RxyYVeoTeCyQ==";

const regions = ['eu-central-2', 'eu-central-1', 'eu-west-3'];

async function probe() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    for (const pwd of [password1, password2]) {
      console.log(`📡 Probing ${host} with password ${pwd.substring(0, 5)}...`);
      const client = new Client({
        host: host,
        port: 6543,
        user: `postgres.${projectRef}`,
        password: pwd,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });
      
      try {
        await client.connect();
        console.log(`✅ SUCCESS! Host: ${host}, Password: ${pwd.substring(0, 5)}...`);
        await client.end();
        process.exit(0);
      } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
      }
    }
  }
}

probe();
