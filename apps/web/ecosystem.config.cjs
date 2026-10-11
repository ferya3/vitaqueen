/**
 * pm2 process file.
 *
 *   pm2 start ecosystem.config.cjs     first start
 *   pm2 reload vitaqueen               after `npm run build`
 *   pm2 logs vitaqueen                 follow the log
 *
 * One process, in fork mode. SQLite in WAL mode would tolerate a cluster, but
 * a marketing site with an admin panel does not need one, and a single
 * process keeps memory predictable on a small VPS.
 *
 * Next.js reads `.env.local` itself, so secrets are not repeated here.
 */
module.exports = {
  apps: [
    {
      name: 'vitaqueen',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      // Loopback only: nginx (or an SSH tunnel) is the way in, never port 3000.
      args: `start --port ${process.env.PORT || 3000} --hostname ${process.env.HOST || '127.0.0.1'}`,
      // `node:sqlite` still prints an ExperimentalWarning on Node 22.
      node_args: '--disable-warning=ExperimentalWarning',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '768M',
      kill_timeout: 8000,
      time: true,
      env: { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
    },
  ],
};
