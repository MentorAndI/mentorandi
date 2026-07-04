module.exports = {
  apps: [
    {
      name: "mentorandi",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
