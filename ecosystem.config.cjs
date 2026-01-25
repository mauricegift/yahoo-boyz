// pm2 ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'yahoo-boyz',
    script: './dist/index.cjs',
    env: {
      NODE_ENV: 'production',
    },
    env_file: '.env', // Specify the .env file I had issues loading the env file while >
  }]
};
