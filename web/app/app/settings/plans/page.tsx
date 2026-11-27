import type { Metadata } from "next";
import BillingScreen from "../billing/billing-screen";

export const metadata: Metadata = { title: "Plans – Edge" };

export default function Page() {
  return <BillingScreen view="plans" />;
}
