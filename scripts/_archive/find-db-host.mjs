import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

const projectRef = "hqeozmmlddvempancnao";
const regions = [
  'eu-central-1', 'eu-central-2', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-northeast-1', 'sa-east-1'
];

async function findHost() {
  console.log("🔍 Zoeken naar werkende database host...");
  
  const hosts = [
    `db.${projectRef}.supabase.co`,
    `${projectRef}.supabase.co`
  ];
  
  for (const region of regions) {
    hosts.push(`aws-0-${region}.pooler.supabase.com`);
  }
  
  for (const host of hosts) {
    try {
      const { address } = await lookup(host);
      console.log(`✅ Host gevonden: ${host} (${address})`);
    } catch (err) {
      // console.log(`❌ ${host}: Niet gevonden`);
    }
  }
}

findHost();
