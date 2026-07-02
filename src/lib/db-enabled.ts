/** Database persistence is opt-in — demo mode works without PostgreSQL. */
export function isDatabaseEnabled(): boolean {
  return process.env.ENABLE_DATABASE === "true";
}
