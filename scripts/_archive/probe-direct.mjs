import pg from 'pg';
const { Client } = pg;

const projectRef = "hqeozmmlddvempancnao";
const password1 = "Privet007.@.@@";

const hosts = [
  `db.${projectRef}.supabase.co`,
  `${projectRef}.supabase.co`
];

async function probe() {
  for (const host of hosts) {
    for (const port of [5432, 6543]) {
      console.log(`📡 Probing ${host}:${port}...`);
      const client = new Client({
        host: host,
        port: port,
        user: `postgres`, // Probeer direct postgres
        password: password1,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });
      
      try {
        await client.connect();
        console.log(`✅ SUCCESS IN ${host}:${port}`);
        await client.end();
        process.exit(0);
      } catch (err) {
        console.log(`❌ ${host}:${port}: ${err.message}`);
      }
    }
  }
}

probe();
