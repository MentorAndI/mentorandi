export function getConversationAuthorLabel(
  role: string,
  mentorName: string,
) {
  return role === "USER" ? "You" : mentorName;
}
