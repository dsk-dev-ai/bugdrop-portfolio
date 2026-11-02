/*
 * Runtime configuration for BUG DROP.
 *
 * Leave apiBase empty for the static MVP. After deploying the SAM backend,
 * paste the HTTP API base URL here (no trailing slash), for example:
 *   window.BUGDROP_CONFIG = { apiBase: "https://abc123.execute-api.us-east-1.amazonaws.com" };
 *
 * The machine works fully without the API; the counter is an enhancement.
 */
window.BUGDROP_CONFIG = {
  apiBase: "",
  github: "https://github.com/darshankachare"
};
