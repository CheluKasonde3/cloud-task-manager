# Task Manager

A React task manager built with **Vite**.

## Run locally

From this `client/` directory:

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173`. Use `npm.cmd` in PowerShell if its execution policy blocks the `npm.ps1` script.

## Build and deploy

Run `npm run build` from `client/`; Vite writes the production site to `client/dist/`.

For a Render Static Site, set the root directory to `client`, the build command to `npm install && npm run build`, and the publish directory to `dist`.

## API configuration and mock mode

The frontend reads the API base URL from `VITE_API_URL`. Set it in `client/.env.local` for local development or in the deployment environment before building. See `.env.example` for the variable name.

When `VITE_API_URL` is empty, the app uses mock CRUD API responses backed by this browser's local storage. This is the default until the backend is ready. Set `VITE_API_URL` to the backend's base URL to use `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, and `DELETE /api/tasks/:id`.

Mock tasks are local to this browser and are not shared or synced. Browser notifications work only while the app is open.
