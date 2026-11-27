import type { Metadata } from "next";
import BillingScreen from "./billing-screen";

export const metadata: Metadata = { title: "Plan and billing – Edge" };

export default function Page() {
  return <BillingScreen view="billing" />;
}
