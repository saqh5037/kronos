module.exports = {
  apps: [
    {
      name: "kronos",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/kronos/error.log",
      out_file: "/var/log/kronos/out.log",
      time: true,
      merge_logs: true,
    },
  ],
};
