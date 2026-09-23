export type Profile = {
  name: string;
  role: string;
  bio: string;
  avatar: string;
};

export const EMPTY_PROFILE: Profile = {
  name: "",
  role: "",
  bio: "",
  avatar: "",
};

export function profileInitial(profile: Profile): string {
  const source = profile.name.trim();
  if (!source) return "";
  const first = source.split(/\s+/)[0];
  return first.slice(0, 1).toUpperCase();
}

export function displayName(profile: Profile): string {
  return profile.name.trim() || "Your profile";
}

export function displayRole(profile: Profile): string {
  return profile.role.trim() || "Set your role";
}
