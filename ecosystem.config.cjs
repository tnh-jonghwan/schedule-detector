module.exports = {
  apps: [{
    name: 'medichis-schedule-detector',
    script: 'npm',
    args: 'start',
    exec_mode: 'fork',
    autorestart: true,
    out_file: './logs/app.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};