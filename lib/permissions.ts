export type GroupMember = {
  user_id: string;
  role: "admin" | "member";
};

export function isAdmin(userId: string | undefined, members: GroupMember[]) {
  if (!userId) return false;
  return members.some((member) => member.user_id === userId && member.role === "admin");
}
