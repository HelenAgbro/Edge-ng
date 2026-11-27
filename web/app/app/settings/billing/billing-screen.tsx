"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import AppFrame from "../../../_components/app-frame";
import { IconAlertCircle, IconCheck, IconCheckCircle, IconChevronRight, IconGear, IconTrash } from "../../../_components/icons";
import { BILLING_PATH, PLANS_PATH, SETTINGS_SECTIONS } from "../settings-links";
import { BillingIcon, CancelPlanDialog, ConfirmPlanDialog, UpdateCardDialog } from "./billing-dialogs";
import {
  getPreviewPlan, getPrice, getPriceUnit, INVOICES, PLAN_IDS, PLANS, RESET_DATE, SAMPLE_CARD, type Cycle, type PlanId,
} from "./billing-preview";
import "./billing.css";

type View = "billing" | "plans";
type Dialog = { kind: "plan"; plan: PlanId; cycle: Cycle } | { kind: "card" } | { kind: "cancel" };
type Preview = "near-limit" | "payment-failed" | "plan-changed" | "cancelled" | null;

const number = new Intl.NumberFormat("en-US");
const invoiceAmounts = "$24.00";

function getPreview(value: string | null): Preview {
  if (value === "near-limit" || value === "payment-failed" || value === "plan-changed" || value === "cancelled") return value;
  return null;
}

function previewHref(path: string, preview: Preview, plan: PlanId, cycle: Cycle) {
  const query = new URLSearchParams();
  if (preview) query.set("preview", preview);
  if (preview === "plan-changed" || preview === "cancelled") query.set("plan", plan);
  if (cycle === "yearly") query.set("cycle", cycle);
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

function Status({ children, failed = false }: { children: string; failed?: boolean }) {
  return (
    <span className={failed ? "billing-failed" : "billing-status"}>
      {failed ? <IconAlertCircle /> : <IconCheckCircle />}{children}
    </span>
  );
}

function Meter({ label, value, limit, warning = false }: {
  label: string;
  value: number;
  limit: number | null;
  warning?: boolean;
}) {
  const text = `${number.format(value)} of ${limit === null ? "unlimited" : number.format(limit)}`;
  return (
    <div className={warning ? "billing-warning-meter" : "billing-meter"}>
      <div><span>{label}</span><span>{text}</span></div>
      {limit !== null && limit > 0
        ? <progress aria-label={label} aria-valuetext={text} value={Math.min(value, limit)} max={limit} />
        : <div className="billing-empty-track" aria-hidden="true"><span className={limit === null ? "billing-unlimited" : undefined} /></div>}
    </div>
  );
}

function sampleInvoice(date: string, failed: boolean) {
  const contents = [
    "Edge – Sample invoice",
    "This document is for the billing preview only.",
    `Date: ${date}`,
    "Plan: Pro, monthly",
    `Amount: ${invoiceAmounts} USD`,
    `Status: ${failed ? "Failed" : "Paid"}`,
  ].join("\n");
  return `data:text/plain;charset=utf-8,${encodeURIComponent(contents)}`;
}

function SettingsNav() {
  return (
    <nav className="billing-settings-nav" aria-label="Settings sections">
      {SETTINGS_SECTIONS.map(({ id, href, label }) => (
        <Link key={id} href={href} aria-current={id === "billing" ? "page" : undefined}>
          {id === "billing" ? <BillingIcon name="card" /> : id === "danger" ? <IconTrash /> : <IconGear />}
          {label}
        </Link>
      ))}
    </nav>
  );
}

function BillingOverview({
  plan, cycle, preview, plansHref, onOpen, cardUpdated,
}: {
  plan: PlanId;
  cycle: Cycle;
  preview: Preview;
  plansHref: string;
  onOpen: (dialog: Dialog) => void;
  cardUpdated: boolean;
}) {
  const details = PLANS[plan];
  const nearLimit = preview === "near-limit";
  const failed = preview === "payment-failed";
  const changed = preview === "plan-changed";
  const cancelled = preview === "cancelled";
  const invoices = useRef<HTMLElement>(null);
  const checks = nearLimit ? 189 : plan === "free" ? 14 : 142;

  function showInvoices() {
    invoices.current?.focus();
  }

  return (
    <div className="billing-billing-layout">
      <SettingsNav />
      <div className="billing-sections">
        {nearLimit && (
          <div className="billing-notice" role="status">
            <span className="billing-warning-text"><BillingIcon name="warning" /></span>
            <p>You have used 189 of 200 trade checks this month. Checks pause at 200 until {RESET_DATE}.</p>
            <Link href={plansHref}>See plans</Link>
          </div>
        )}
        {failed && (
          <div className="billing-error-notice" role="status">
            <span className="billing-error-text"><BillingIcon name="warning" /></span>
            <p>Your payment did not go through. Update your card by 25 November to keep Pro.</p>
            <button type="button" onClick={() => onOpen({ kind: "card" })}>Update card</button>
          </div>
        )}
        {cancelled && (
          <div className="billing-notice" role="status">
            <span className="billing-warning-text"><BillingIcon name="warning" /></span>
            <p>Demo cancellation scheduled. You keep {details.name} until {RESET_DATE}.</p>
          </div>
        )}
        <section className="billing-panel">
          <div className="billing-overview-row">
            <div>
              <div className="billing-inline-title">
                <h2 className="billing-plan-name">{details.name}</h2>
                <span className="billing-neutral">{plan === "free" ? "Free plan" : `Billed ${cycle}`}</span>
              </div>
              {plan !== "free" && <p className="billing-meta">${getPrice(plan, cycle)} {getPriceUnit(plan, cycle)}. Next bill on {RESET_DATE}.</p>}
            </div>
            <div className="billing-row-actions">
              {plan !== "free" && !cancelled && <button type="button" className="billing-button" onClick={() => onOpen({ kind: "cancel" })}>Cancel plan</button>}
              <Link href={plansHref} className="billing-primary"><BillingIcon name="bolt" /> Change plan</Link>
            </div>
          </div>
        </section>

        <section className="billing-panel" aria-labelledby="billing-usage">
          <h2 id="billing-usage">Usage this month</h2>
          <p className="billing-meta">Resets on {RESET_DATE}.</p>
          <div className="billing-meters">
            <Meter label="Trade checks" value={checks} limit={details.limits.checks} warning={nearLimit} />
            <Meter label="Checklists" value={plan === "free" ? 2 : 3} limit={details.limits.checklists} />
            <Meter label="Voice minutes" value={plan === "free" ? 0 : 38} limit={details.limits.voice} />
          </div>
        </section>

        <section className="billing-panel" aria-label="Payment method">
          <div className="billing-overview-row">
            <div className="billing-payment">
              <span className="billing-card-icon"><BillingIcon name="card" /></span>
              <div>
                <div className="billing-inline-title">
                  <h2>{SAMPLE_CARD}</h2>
                  {failed && <Status failed>Declined</Status>}
                </div>
                <p className="billing-meta">Expires 08/28</p>
              </div>
            </div>
            <button type="button" className={failed ? "billing-primary" : "billing-button"} aria-label="Update card" onClick={() => onOpen({ kind: "card" })}>
              {failed ? "Update card" : "Update"}
            </button>
          </div>
        </section>

        <section className="billing-panel" aria-labelledby="billing-invoices" tabIndex={-1} ref={invoices}>
          <h2 id="billing-invoices">Invoices</h2>
          <ul className="billing-invoices">
            {INVOICES.map((date, index) => {
              const invoiceFailed = failed && index === 0;
              return (
                <li key={date}>
                  <span>{date}</span>
                  <span className="billing-invoice-plan">Pro, monthly</span>
                  <span className="billing-invoice-amount">{invoiceAmounts}</span>
                  <Status failed={invoiceFailed}>{invoiceFailed ? "Failed" : "Paid"}</Status>
                  <a href={sampleInvoice(date, invoiceFailed)} download={`edge-sample-invoice-${date.replaceAll(" ", "-")}.txt`}
                    className="billing-download" aria-label={`Download sample invoice for ${date}`}>
                    <BillingIcon name="download" />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
        {(changed || cardUpdated) && (
          <div className="billing-success-notice" role="status">
            <IconCheckCircle />
            <p>{cardUpdated ? "Demo card saved. No payment was processed." : `Your preview plan is now ${details.name}. ${plan === "free" ? "" : `Your next sample bill is on ${RESET_DATE}.`}`}</p>
            {!cardUpdated && <button type="button" onClick={showInvoices}>View invoice</button>}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanPicker({
  current, currentCycle, billingHref, onOpen,
}: {
  current: PlanId;
  currentCycle: Cycle;
  billingHref: string;
  onOpen: (dialog: Dialog) => void;
}) {
  const [cycle, setCycle] = useState<Cycle>(currentCycle);
  return (
    <>
      <Link href={billingHref} className="billing-back"><IconChevronRight /> Plan and billing</Link>
      <div className="billing-plans-heading">
        <div>
          <h2>Plans</h2>
          <p>Pick what fits how often you check trades. You can change it any time.</p>
        </div>
        <div className="billing-cycle" role="group" aria-label="Billing interval">
          <button type="button" aria-pressed={cycle === "monthly"} onClick={() => setCycle("monthly")}>Monthly</button>
          <button type="button" aria-pressed={cycle === "yearly"} onClick={() => setCycle("yearly")}>
            Yearly <span>2 months free</span>
          </button>
        </div>
      </div>
      <div className="billing-plan-grid">
        {PLAN_IDS.map((id) => {
          const plan = PLANS[id];
          const isCurrent = current === id;
          const sameSelection = isCurrent && (id === "free" || cycle === currentCycle);
          const upgrade = plan.monthly > PLANS[current].monthly;
          const action = isCurrent
            ? `Switch to ${cycle}`
            : `${upgrade ? "Upgrade" : "Downgrade"} to ${plan.name}`;
          const rate = id === "free" ? "monthly" : cycle;
          return (
            <article className={isCurrent ? "billing-current-plan" : "billing-plan-card"} key={id}>
              <div className="billing-inline-title">
                <h3>{plan.name}</h3>
                {isCurrent && <Status>Current plan</Status>}
              </div>
              <p className="billing-price"><strong>${number.format(getPrice(id, rate))}</strong> {getPriceUnit(id, rate)}</p>
              <p className="billing-plan-description">{plan.description}</p>
              <button
                type="button"
                className={upgrade || (isCurrent && !sameSelection) ? "billing-primary" : "billing-button"}
                disabled={sameSelection}
                onClick={() => onOpen(id === "free" ? { kind: "cancel" } : { kind: "plan", plan: id, cycle })}
              >
                {sameSelection ? "Current plan" : action}
              </button>
              <ul className="billing-features">
                {plan.features.map((feature) => <li key={feature}><IconCheck /> {feature}</li>)}
              </ul>
            </article>
          );
        })}
      </div>
      <p className="billing-plans-foot">Prices are in US dollars. Changes apply to your next bill. You can cancel any time.</p>
    </>
  );
}

function BillingContent({ view }: { view: View }) {
  const router = useRouter();
  const params = useSearchParams();
  const preview = getPreview(params.get("preview"));
  const plan = preview === null || preview === "near-limit" || preview === "payment-failed"
    ? "pro"
    : getPreviewPlan(params.get("plan") ?? (preview === "cancelled" ? "pro" : null));
  const cycle: Cycle = params.get("cycle") === "yearly" ? "yearly" : "monthly";
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [cardUpdated, setCardUpdated] = useState(false);
  const billingHref = previewHref(BILLING_PATH, preview, plan, cycle);
  const plansHref = previewHref(PLANS_PATH, preview, plan, cycle);

  function closeDialog() {
    setDialog(null);
  }

  function changePlan(next: PlanId, nextCycle: Cycle, state: "plan-changed" | "cancelled") {
    closeDialog();
    router.push(previewHref(BILLING_PATH, state, next, nextCycle));
  }

  return (
    <div className="billing-scope">
      <div className="billing-container">
        {view === "billing" ? (
          <>
            <div className="billing-intro">
              <h2>Plan and billing</h2>
              <p>Manage your subscription, usage and invoices.</p>
            </div>
            <BillingOverview plan={plan} cycle={cycle} preview={preview} plansHref={plansHref} onOpen={setDialog} cardUpdated={cardUpdated} />
          </>
        ) : <PlanPicker current={plan} currentCycle={cycle} billingHref={billingHref} onOpen={setDialog} />}
        <p className="billing-preview-note">Billing preview. Plan changes, payments and invoices use demo data.</p>
      </div>
      {dialog?.kind === "plan" && (
        <ConfirmPlanDialog current={plan} next={dialog.plan} cycle={dialog.cycle} onClose={closeDialog}
          onConfirm={() => changePlan(dialog.plan, dialog.cycle, "plan-changed")} />
      )}
      {dialog?.kind === "card" && (
        <UpdateCardDialog onClose={closeDialog} onConfirm={() => { closeDialog(); setCardUpdated(true); }} />
      )}
      {dialog?.kind === "cancel" && (
        <CancelPlanDialog plan={plan} onClose={closeDialog} onConfirm={() => changePlan(plan, cycle, "cancelled")} />
      )}
    </div>
  );
}

export default function BillingScreen({ view }: { view: View }) {
  return (
    <AppFrame active="settings" title="Settings">
      <Suspense>
        <BillingContent view={view} />
      </Suspense>
    </AppFrame>
  );
}
