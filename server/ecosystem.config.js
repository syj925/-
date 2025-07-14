module.exports = {
  apps: [{
    name: "campus-wall-api",
    script: "./src/server.js",
    instances: "max",  // 使用所有可用CPU核心
    exec_mode: "cluster",
    watch: false,
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    combine_logs: true,
    merge_logs: true,
    error_file: "./logs/pm2-error.log",
    out_file: "./logs/pm2-out.log"
  }]
}; 