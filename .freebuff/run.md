# Run doc — Frebuff (Vite + React)

Worktree: `C:\Users\Azzamir Syafiq\Downloads\frebuff`
Port: `5173`
Log: `C:\Users\Azzamir Syafiq\Downloads\frebuff\.freebuff\preview-a5255c73-beb4-4017-a082-097b0a80b7bc.log`

## Reproduce artifacts (fresh checkout)

1. No `.env.local` — none required by this project (no secrets/env vars needed to run dev).
2. Install dependencies with the project's package manager:
   ```powershell
   cd C:\Users\Azzamir Syafiq\Downloads\frebuff
   npm install
   ```

## Run the server

```powershell
cd C:\Users\Azzamir Syafiq\Downloads\frebuff
npm run dev
```

Vite binds to `http://localhost:5173/` by default. If that port is taken, set `PORT=<free>` before running.

TypeScript typecheck: `npx tsc -b --noEmit`
Build: `npm run build`
