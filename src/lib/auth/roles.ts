export type ProfileRole = "user" | "interpreter" | "admin";

const HOME_PATH_BY_ROLE: Record<ProfileRole, string> = {
  user: "/app/user",
  interpreter: "/app/interpreter",
  admin: "/app/admin",
};

export function homePathForRole(role: ProfileRole): string {
  return HOME_PATH_BY_ROLE[role];
}
