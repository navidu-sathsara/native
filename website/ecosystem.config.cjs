module.exports = {
  apps: [
    {
      name: 'native-website',
      script: './server.mjs',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '128M',
      time: true,
      env: {
        HOST: '127.0.0.1',
        PORT: '8787',
        NODE_ENV: 'production'
      }
    }
  ]
}
