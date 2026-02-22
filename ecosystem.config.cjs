/**
 * PM2 ecosystem config for GetSign (Next.js) on VPS.
 *
 * Do NOT put secrets here. On the VPS create .env or .env.production
 * (same keys as .env.local, production values) in this directory;
 * Next.js loads them automatically when the app starts.
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup   # persist across reboots
 */
module.exports = {
  apps: [
    {
      name: "getsign",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      // Restart if memory exceeds 500M (adjust as needed)
      max_memory_restart: "500M",
      merge_logs: true,
      time: true,
    },
  ],
};
