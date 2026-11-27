"use client";

import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { IconAlertCircle, IconX } from "../../../_components/icons";
import { getPrice, getPriceUnit, PLANS, RESET_DATE, SAMPLE_CARD, type Cycle, type PlanId } from "./billing-preview";

export function BillingIcon({ name }: { name: "bolt" | "card" | "download" | "warning" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="17" height="17">
      {name === "bolt" && <path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z" />}
      {name === "card" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>}
      {name === "download" && <path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" />}
      {name === "warning" && <path d="m10.4 4.6-7.6 13A1.6 1.6 0 0 0 4.2 20h15.6a1.6 1.6 0 0 0 1.4-2.4l-7.6-13a1.8 1.8 0 0 0-3.2 0ZM12 9v4m0 3h.01" />}
    </svg>
  );
}

function BillingDialog({
  title, description, icon, children, onClose,
}: {
  title: string;
  description: string;
  icon?: "bolt" | "warning";
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="billing-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="billing-dialog-body">
        <button type="button" className="billing-close" aria-label="Close dialog" onClick={onClose}>
          <IconX />
        </button>
        {icon && <span className={icon === "warning" ? "billing-warning-icon" : "billing-action-icon"}><BillingIcon name={icon} /></span>}
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId} className="billing-dialog-description">{description}</p>
        {children}
      </div>
    </dialog>
  );
}

export function ConfirmPlanDialog({ current, next, cycle, onClose, onConfirm }: {
  current: PlanId;
  next: PlanId;
  cycle: Cycle;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isUpgrade = PLANS[next].monthly > PLANS[current].monthly;
  const title = next === current
    ? `Switch to ${cycle} billing?`
    : `${isUpgrade ? "Upgrade" : "Change plan"} to ${PLANS[next].name}?`;
  const sampleUpgrade = current === "pro" && next === "team" && cycle === "monthly";

  return (
    <BillingDialog title={title} description={
      sampleUpgrade
        ? "In this preview, your new plan starts straight away. The estimate covers the days left in this month."
        : "Preview this change to your plan and billing schedule."
    } icon="bolt" onClose={onClose}>
      <div className="billing-summary">
        <dl>
          <div><dt>{PLANS[next].name}, {cycle}</dt><dd>${getPrice(next, cycle).toFixed(2)} {getPriceUnit(next, cycle)}</dd></div>
          {next === "team" && <div><dt>Seats</dt><dd>1</dd></div>}
          {sampleUpgrade && <div className="billing-charge"><dt>Sample charge today</dt><dd>$35.20</dd></div>}
        </dl>
        {sampleUpgrade && <p>Prorated for the 12 days left in this sample billing month. Next bill: $59.00 on {RESET_DATE}.</p>}
      </div>
      <p className="billing-card-note"><BillingIcon name="card" /> Demo payment method: {SAMPLE_CARD}</p>
      <div className="billing-dialog-actions">
        <button className="billing-button" type="button" onClick={onClose}>Cancel</button>
        <button className="billing-primary" type="button" onClick={onConfirm}>{isUpgrade ? "Confirm upgrade" : "Confirm change"}</button>
      </div>
    </BillingDialog>
  );
}

export function UpdateCardDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <BillingDialog title="Update your card" description="Preview the payment form with a sample card." onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onConfirm(); }}>
        <div className="billing-card-fields">
          <label>Name on card<input value="Helen Adeyemi" readOnly /></label>
          <label>Card number<span className="billing-card-input"><input value="•••• •••• •••• 4242" readOnly /><BillingIcon name="card" /></span></label>
          <div className="billing-split-fields">
            <label>Expiry<input value="08 / 28" readOnly /></label>
            <label>CVC<input value="•••" readOnly /></label>
          </div>
          <label>Billing country<select defaultValue="Nigeria"><option>Nigeria</option></select></label>
        </div>
        <p className="billing-card-note"><IconAlertCircle /> Live card entry will be available through Edge’s payment provider.</p>
        <div className="billing-dialog-actions">
          <button className="billing-button" type="button" onClick={onClose}>Cancel</button>
          <button className="billing-primary" type="submit">Save demo card</button>
        </div>
      </form>
    </BillingDialog>
  );
}

export function CancelPlanDialog({ plan, onClose, onConfirm }: { plan: PlanId; onClose: () => void; onConfirm: () => void }) {
  const name = PLANS[plan].name;
  const checks = PLANS[plan].limits.checks.toLocaleString("en-US");
  return (
    <BillingDialog title={`Cancel ${name}?`} description={`In this preview, you keep ${name} until ${RESET_DATE}. After that your account moves to Free.`}
      icon="warning" onClose={onClose}>
      <div className="billing-summary">
        <h3>What changes</h3>
        <ul className="billing-change-list">
          <li><IconAlertCircle /> Trade checks drop from {checks} to 20 a month.</li>
          <li><IconAlertCircle /> 1 of your 3 checklists will be archived. You choose which.</li>
          <li><IconAlertCircle /> Journal entries older than 30 days are hidden. They return if you upgrade again.</li>
        </ul>
      </div>
      <label className="billing-reason">Why are you cancelling?
        <select defaultValue="">
          <option value="">Choose a reason (optional)</option>
          <option>Too expensive</option>
          <option>I don’t use Edge enough</option>
          <option>Other</option>
        </select>
      </label>
      <div className="billing-dialog-actions">
        <button className="billing-danger" type="button" onClick={onConfirm}>Cancel plan</button>
        <button className="billing-primary" type="button" onClick={onClose}>Keep {name}</button>
      </div>
    </BillingDialog>
  );
}
