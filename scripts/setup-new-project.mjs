import pg from 'pg';
const { Client } = pg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Gebruik de verbindingsgegevens van de gebruiker
const projectRef = "hqeozmmlddvempancnao";
const password = "Privet007.@.@@";

// Probeer verschillende mogelijke hostnames
const hostnames = [
  `db.${projectRef}.supabase.co`,
  `${projectRef}.supabase.co`,
  `aws-0-eu-central-1.pooler.supabase.com`,
  `aws-0-eu-west-1.pooler.supabase.com` // Ook een vaak voorkomende fallback
];

async function main() {
  let connected = false;

  for (const host of hostnames) {
    if (connected) break;
    console.log(`🔍 Proberen te verbinden met host: ${host}...`);
    const isPooler = host.includes('pooler');
    const client = new Client({
      host: host,
      port: isPooler ? 6543 : 5432,
      user: isPooler ? `postgres.${projectRef}` : 'postgres',
      password: password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000 
    });

    try {
      await client.connect();
      connected = true;
      console.log(`✅ Succesvol verbonden met host: ${host}`);

      const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
      const files = [
        '001_initial_schema.sql',
        '002_add_missing_tables.sql',
        '003_offertes_ai_media.sql',
        '004_user_settings.sql',
        '005_admin_tables.sql',
        '006_ai_pdf_templates.sql',
        '006_database_optimization.sql',
        '007_user_integrations.sql',
        '008_ai_pdf_templates.sql'
      ];

      for (const file of files) {
        console.log(`⏳ Migratie uitvoeren: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        try {
          await client.query(sql);
          console.log(`✅ ${file} voltooid`);
        } catch (err) {
          console.warn(`⚠️ Waarschuwing bij ${file}: ${err.message}`);
        }
      }

      console.log("🛠️ Admin setup uitvoeren...");
      const adminSql = `
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
      `;
      await client.query(adminSql);
      console.log("✅ Admin setup voltooid");

      await client.end();
    } catch (err) {
      console.warn(`❌ Kon niet verbinden met ${host}: ${err.message}`);
      // Ga door naar de volgende host
    }
  }

  if (!connected) {
    console.error("❌ Kon met geen enkele host verbinding maken.");
    process.exit(1);
  }
}

main();
