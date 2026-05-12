/** Single-line display name for UI (organizers, players). */
export function formatUserDisplayName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}
