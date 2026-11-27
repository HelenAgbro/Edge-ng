export const BILLING_PATH = "/app/settings/billing";
export const PLANS_PATH = "/app/settings/plans";

export const SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile & Preferences", href: "/app/settings" },
  { id: "billing", label: "Plan and billing", href: BILLING_PATH },
  { id: "export", label: "Data & Export", href: "/app/settings?tab=export" },
  { id: "danger", label: "Account Deletion", href: "/app/settings?tab=danger" },
] as const;
