{
  "apps": [{
    "name": "hotels-vendors-os",
    "cwd": "/var/www/hotelsvendors-v2/backend_os",
    "script": "/var/www/hotelsvendors-v2/backend_os/venv/bin/uvicorn",
    "args": "src.main:app --host 0.0.0.0 --port 8001",
    "exec_interpreter": "none",
    "exec_mode": "fork",
    "max_memory_restart": "512M",
    "env": {
      "PYTHONPATH": "/var/www/hotelsvendors-v2/backend_os",
      "DB_HOST": "localhost",
      "DB_PORT": "5432",
      "DB_NAME": "hotels_vendors",
      "DB_USERNAME": "hotels_vendors",
      "REDIS_HOST": "localhost",
      "REDIS_PORT": "6380"
    },
    "error_file": "/var/log/hotelsvendors-os/error.log",
    "out_file": "/var/log/hotelsvendors-os/out.log",
    "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
    "merge_logs": true,
    "restart_delay": 3000,
    "max_restarts": 5,
    "min_uptime": "10s",
    "watch": false,
    "kill_timeout": 5000,
    "listen_timeout": 10000
  }]
}
