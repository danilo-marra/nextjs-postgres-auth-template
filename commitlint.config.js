module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [
    // Ignore this legacy PR commit message to avoid requiring force-push history rewrites.
    (message) =>
      message.split("\n")[0] ===
      "Update README: fix versions, add missing env vars, scripts, and project structure",
  ],
};
