# Azure Static Web Apps deployment

The GitHub Actions workflow builds the Vite application from `/` and publishes `dist`.

Build environment:

```env
VITE_API_BASE_URL=https://caverna-jiujitsu-api.chickenkiller.com
VITE_API_TIMEOUT_MS=10000
```

These public client settings are passed to the Azure deployment action during the build. Vite embeds used `VITE_` values at build time; changing runtime settings alone does not update an existing bundle. Keep local development settings in an untracked `.env` using `.env.example`.

`public/staticwebapp.config.json` is copied into `dist` and rewrites client routes to `index.html`, excluding generated assets.

After merging, verify the GitHub Actions deployment, open the site and refresh a client route. API requests also require the backend to allow the deployed frontend origin through CORS. Demo services and the current authentication placeholder are separate from deployment configuration.
