# My Chess Journey

A mobile-first installable PWA for tracking your chess training.

## Included in this first build
- Rapid rating tracker with a 1500 target
- Daily training checklist
- Game journal and puzzle-focus log
- Public Lichess profile/game links
- Local browser storage and JSON backup/restore
- Installable PWA manifest, icons and service worker
- Starter Cloudflare Worker/Durable Object WebSocket room relay

## Important limitations
This is a first foundation build, not the complete planned app. The board is a visual practice board and does not yet validate legal moves. The AI tutor is not connected to an AI service. Lichess OAuth/private data sync is not implemented. The multiplayer Worker is only a starter message relay and is not secure or suitable for rated games. Data is stored locally in the browser; export backups.

## Deploy with Cloudflare
1. Create a Cloudflare account.
2. Connect this GitHub repository to Workers & Pages / Workers Builds.
3. Configure the project to deploy with `npm run deploy` (or use Wrangler from a development environment).
4. The first deployment may require Durable Objects migration support.

Never put API keys or private tokens in browser code or commit them to GitHub.
