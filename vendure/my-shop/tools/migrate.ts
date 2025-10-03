import 'dotenv/config';
import { generateMigration, runMigrations } from '@vendure/core';
import { config } from '../src/vendure-config';

async function main() {
  const cmd = process.argv[2];
  if (cmd === 'generate') {
    const name = process.argv[3] || 'migration';
    await generateMigration(config, { name, outputDir: './src/migrations' });
    console.log('Migration generated:', name);
  } else if (cmd === 'run') {
    await runMigrations(config);
    console.log('Migrations run complete');
  } else {
    console.log('Usage: ts-node tools/migrate.ts generate <name> | run');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
