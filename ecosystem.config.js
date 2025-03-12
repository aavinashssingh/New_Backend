module.exports = {
  apps: [
    {
      name: "beckend",
      script: "./server.js",

      // Stability Settings
      instances: 2,
      exec_mode: "cluster",
      watch: false,
      // Auto-Restart on Failure
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: "600M",

      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // Avoid Crash Loops
      exp_backoff_restart_delay: 100, // Exponential backoff on crashes
   }
//    {
//      name: "nectar-be",
//      script: "./server.js",
//      instances: "max",
//      exec_mode: "cluster",
//      exp_backoff_restart_delay: 100,
//    },
    // {
    //   name: "cronserver",
    //   script: "./cron/cronserver.js",
    //   exec_mode: "cluster_mode",
    //   instances: 1,
    // },
  ],
};
