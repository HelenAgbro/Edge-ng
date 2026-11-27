export type PlanId = "free" | "pro" | "team";
export type Cycle = "monthly" | "yearly";

export const PLANS = {
  free: {
    name: "Free",
    monthly: 0,
    description: "For trying Edge on a few trades.",
    features: ["20 trade checks a month", "2 checklists", "30 days of journal history", "Chat by typing"],
    limits: { checks: 20, checklists: 2, voice: 0 },
  },
  pro: {
    name: "Pro",
    monthly: 24,
    description: "For traders who check every trade.",
    features: ["200 trade checks a month", "10 checklists", "Full journal history", "Voice input", "Export your journal"],
    limits: { checks: 200, checklists: 10, voice: 120 },
  },
  team: {
    name: "Team",
    monthly: 59,
    description: "For groups who share one plan.",
    features: ["1,000 trade checks per seat", "Unlimited checklists", "Shared checklists", "Admin controls", "Priority support"],
    limits: { checks: 1_000, checklists: null, voice: 300 },
  },
} satisfies Record<PlanId, {
  name: string;
  monthly: number;
  description: string;
  features: string[];
  limits: { checks: number; checklists: number | null; voice: number };
}>;

export const PLAN_IDS: readonly PlanId[] = ["free", "pro", "team"];
export const RESET_DATE = "1 December";
export const SAMPLE_CARD = "Visa ending 4242";
export const INVOICES = ["1 Nov 2026", "1 Oct 2026", "1 Sep 2026"];

export function getPrice(plan: PlanId, cycle: Cycle) {
  return PLANS[plan].monthly * (cycle === "yearly" ? 10 : 1);
}

export function getPriceUnit(plan: PlanId, cycle: Cycle) {
  return (cycle === "yearly" ? "a year" : "a month") + (plan === "team" ? " per seat" : "");
}

export function getPreviewPlan(value: string | null): PlanId {
  return value === "free" || value === "pro" || value === "team" ? value : "team";
}
