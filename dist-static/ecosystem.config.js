module.exports = {
  "apps": [
    {
      "name": "import-records-app",
      "script": "./server.js",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3006,
        "HOST": "0.0.0.0"
      },
      "env_production": {
        "NODE_ENV": "production",
        "PORT": 3006,
        "HOST": "0.0.0.0"
      },
      "log_date_format": "YYYY-MM-DD HH:mm:ss",
      "error_file": "./logs/error.log",
      "out_file": "./logs/out.log",
      "log_file": "./logs/combined.log",
      "time": true,
      "autorestart": true,
      "max_restarts": 10,
      "min_uptime": "10s",
      "max_memory_restart": "1G"
    }
  ]
}