module.exports = {
    apps: [
      {
        name: "ffmpeg-service",
        script: "./dist/server.js",
        instances: "1",
        exec_mode: "cluster",
        autorestart: true,
        watch: false,
        max_memory_restart: "4G",
        env: {
          NODE_ENV: "production",
        },
        env_production: {
          NODE_ENV: "production",
        },
      },
    ],
  };