Užitečné příkazy
# Redeploy frontend
npm run build && npx wrangler pages deploy out --project-name multisuggest
# Redeploy worker
cd worker && npx wrangler deploy
# Manuální scrape trigger
curl https://multisuggest-scraper.soukoli.workers.dev/scrape
# Kontrola DB
npx wrangler d1 execute multisuggest-db --remote --command "SELECT COUNT(*) FROM facilities"