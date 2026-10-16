import type { Profile } from "./types";

export function trialDaysLeft(profile: Profile) {
  return Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86_400_000));
}

export function hasAccess(profile: Profile) {
  if (profile.subscription_status === "active") return true;
  return profile.subscription_status === "trialing" && trialDaysLeft(profile) > 0;
}
