"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

// ─── Plans ───────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price_usd: 49,
    price_inr: 4067,
    credits: 100,
    users: 1,
    badge: null,
    color: "#4F8EF7",
    features: [
      "100 lead unlocks / month",
      "AI cold email writer",
      "Deal pipeline CRM",
      "Compliance checker (44 laws)",
      "CSV export",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price_usd: 199,
    price_inr: 16517,
    credits: 500,
    users: 5,
    badge: "MOST POPULAR",
    color: "#7C3AED",
    features: [
      "500 lead unlocks / month",
      "5 team seats",
      "All AI features",
      "Priority support",
      "Saved searches & watchlist",
      "Market map & heatmap",
      "Bulk pipeline actions",
    ],
  },
  {
    id: "business",
    name: "Business",
    price_usd: 499,
    price_inr: 41417,
    credits: 2500,
    users: 999,
    badge: "ENTERPRISE",
    color: "#D97706",
    features: [
      "2,500 lead unlocks / month",
      "Unlimited team seats",
      "REST API access",
      "Dedicated account manager",
      "Custom onboarding",
      "SLA guarantee",
      "White-glove support",
    ],
  },
];

const CURRENCIES = [
  { id: "INR", label: "₹ INR — India (NEFT / RTGS / IMPS)", flag: "🇮🇳" },
  { id: "USD", label: "$ USD — Wire Transfer", flag: "🇺🇸" },
  { id: "GBP", label: "£ GBP — Wire Transfer", flag: "🇬🇧" },
  { id: "EUR", label: "€ EUR — Wire Transfer", flag: "🇪🇺" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n, cur) => {
  const sym = { INR: "₹", USD: "$", GBP: "£", EUR: "€" }[cur] ?? cur;
  return `${sym}${Number(n).toLocaleString("en-IN")}`;
};

function planPrice(plan, currency) {
  if (currency === "INR") return plan.price_inr;
  const rates = { USD: 1, GBP: 0.79, EUR: 0.92 };
  return Math.round(plan.price_usd * (rates[currency] ?? 1));
}

// ─── Copy-to-clipboard helper ─────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button onClick={copy} style={styles.copyBtn}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function Field({ label, value }) {
  return (
    <div style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <span style={styles.fieldVal}>{value}</span>
      <CopyBtn text={String(value)} />
    </div>
  );
}

// ─── Bank detail sections ─────────────────────────────────────────────────────
function InrSection({ methods }) {
  const m = methods?.find((x) => x.id === "neft");
  if (!m) return <p style={{ color: "#888", fontSize: 14 }}>Loading bank details…</p>;
  const d = m.details;
  return (
    <div>
      <p style={styles.bankNote}>
        Transfer exactly the plan amount. Use NEFT / RTGS / IMPS via your bank app or net banking.
      </p>
      <Field label="Bank" value={d.bank} />
      <Field label="Account Holder" value={d.account_holder} />
      <Field label="Account Number" value={d.account_number} />
      <Field label="IFSC Code" value={d.ifsc} />
      <Field label="Account Type" value="Current Account" />
      <div style={styles.tipBox}>
        Save the UTR / transaction reference — you will enter it below to confirm.
      </div>
    </div>
  );
}

function SwiftSection({ methods, currency }) {
  const idMap = { USD: "swift_usd", GBP: "swift_gbp", EUR: "swift_eur" };
  const m = methods?.find((x) => x.id === idMap[currency]);
  if (!m) return <p style={{ color: "#888", fontSize: 14 }}>Loading wire details…</p>;
  const d = m.details;
  return (
    <div>
      <p style={styles.bankNote}>
        Instruct your bank to send an international wire transfer to the beneficiary below.
      </p>
      <Field label="Beneficiary Name" value={d.beneficiary} />
      <Field label="Beneficiary Account" value={d.account} />
      <Field label="Beneficiary Bank" value={d.bank} />
      <Field label="Bank SWIFT Code" value={d.bank_swift} />
      <Field label="Correspondent Bank" value={d.correspondent} />
      <Field label="Correspondent SWIFT" value={d.correspondent_swift} />
      {d.iban && <Field label="IBAN / Routing" value={d.iban} />}
      {d.nostro && <Field label="Nostro Account" value={d.nostro} />}
      <div style={styles.tipBox}>
        Save the SWIFT/wire reference number — you will enter it below.
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [currency, setCurrency] = useState("INR");
  const [methods, setMethods] = useState(null);
  const [step, setStep] = useState(1); // 1=choose 2=pay 3=confirm 4=done

  // Form state
  const [form, setForm] = useState({
    buyer_name: "",
    buyer_email: "",
    buyer_company: "",
    buyer_phone: "",
    transfer_ref: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    apiFetch("/payment/methods").then((r) => {
      if (r.success) setMethods(r.methods);
    });
  }, []);

  const plan = PLANS.find((p) => p.id === selectedPlan);
  const amount = planPrice(plan, currency);

  const handleInput = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.buyer_name.trim()) return setError("Please enter your name.");
    if (!form.buyer_email.includes("@")) return setError("Please enter a valid email.");
    if (!form.transfer_ref.trim()) return setError("Please enter the transfer / UTR reference.");
    setSubmitting(true);
    try {
      const res = await apiFetch("/payment/confirm", {
        method: "POST",
        body: JSON.stringify({
          plan: selectedPlan,
          currency,
          amount,
          transfer_ref: form.transfer_ref.trim(),
          buyer_name: form.buyer_name.trim(),
          buyer_email: form.buyer_email.trim(),
          buyer_company: form.buyer_company.trim() || undefined,
          buyer_phone: form.buyer_phone.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      if (res.success) {
        setRefCode(res.reference || form.transfer_ref);
        setStep(4);
      } else {
        setError(res.detail || "Something went wrong. Please email service@nanoneuron.ai");
      }
    } catch {
      setError("Network error. Please email service@nanoneuron.ai");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 4: Success ──────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.successTitle}>Confirmation Received</h1>
          <p style={styles.successSub}>
            Your payment confirmation has been submitted. We verify every transfer personally — your account will be activated within <strong>24 hours</strong>.
          </p>
          <div style={styles.refBox}>
            <span style={{ color: "#888", fontSize: 13 }}>Your reference</span>
            <span style={styles.refCode}>{refCode}</span>
          </div>
          <p style={styles.successNote}>
            A confirmation has been sent to <strong>{form.buyer_email}</strong>.<br />
            Questions? Write to <a href="mailto:service@nanoneuron.ai" style={{ color: "#4F8EF7" }}>service@nanoneuron.ai</a>
          </p>
          <a href="/dashboard" style={styles.dashBtn}>Go to Dashboard →</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <a href="/" style={styles.logo}>
          <span style={{ color: "#4F8EF7" }}>Nano</span>neuron
        </a>
        <div style={styles.headerTag}>Secure Bank Transfer — No gateway fees</div>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Upgrade Nanoneuron</h1>
        <p style={styles.heroSub}>
          Direct bank transfer — India or international. No payment gateway middlemen.<br />
          Confirmation within 24 hours. Cancel any time.
        </p>
      </div>

      {/* Step indicator */}
      <div style={styles.steps}>
        {["Select Plan", "Payment Details", "Confirm Transfer"].map((s, i) => (
          <div key={i} style={styles.stepItem}>
            <div style={{
              ...styles.stepDot,
              background: step > i + 1 ? "#22C55E" : step === i + 1 ? "#4F8EF7" : "#2A2A3E",
              color: step >= i + 1 ? "#fff" : "#555",
              borderColor: step >= i + 1 ? "transparent" : "#333",
            }}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span style={{ color: step === i + 1 ? "#fff" : "#555", fontSize: 13 }}>{s}</span>
          </div>
        ))}
      </div>

      {/* ── STEP 1: Plan selection ── */}
      {step === 1 && (
        <div style={styles.section}>
          <div style={styles.planGrid}>
            {PLANS.map((p) => {
              const sel = selectedPlan === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  style={{
                    ...styles.planCard,
                    borderColor: sel ? p.color : "#1E1E2E",
                    background: sel ? `${p.color}12` : "#111120",
                    cursor: "pointer",
                  }}
                >
                  {p.badge && (
                    <div style={{ ...styles.badge, background: p.color }}>
                      {p.badge}
                    </div>
                  )}
                  <div style={{ ...styles.planDot, borderColor: sel ? p.color : "#333", background: sel ? p.color : "transparent" }} />
                  <h3 style={styles.planName}>{p.name}</h3>
                  <div style={styles.planPrice}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: sel ? p.color : "#fff" }}>
                      ₹{p.price_inr.toLocaleString("en-IN")}
                    </span>
                    <span style={{ color: "#555", fontSize: 13, marginLeft: 6 }}>/month</span>
                  </div>
                  <div style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>
                    ${p.price_usd} USD · {p.credits} unlocks
                  </div>
                  <ul style={styles.featureList}>
                    {p.features.map((f, i) => (
                      <li key={i} style={styles.featureItem}>
                        <span style={{ color: p.color, marginRight: 8 }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Currency */}
          <div style={styles.currencyRow}>
            <span style={styles.label}>Pay in</span>
            <div style={styles.currencyGroup}>
              {CURRENCIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCurrency(c.id)}
                  style={{
                    ...styles.currBtn,
                    background: currency === c.id ? "#4F8EF720" : "transparent",
                    borderColor: currency === c.id ? "#4F8EF7" : "#2A2A3E",
                    color: currency === c.id ? "#4F8EF7" : "#888",
                  }}
                >
                  {c.flag} {c.id}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.totalRow}>
            <span style={{ color: "#888" }}>Total due today</span>
            <span style={styles.totalAmt}>{fmt(amount, currency)} / month</span>
          </div>

          <button
            onClick={() => setStep(2)}
            style={{ ...styles.primaryBtn, background: PLANS.find((p) => p.id === selectedPlan)?.color }}
          >
            Proceed to Payment Details →
          </button>
        </div>
      )}

      {/* ── STEP 2: Payment details ── */}
      {step === 2 && (
        <div style={styles.section}>
          <div style={styles.summaryBar}>
            <span>{plan.name} — {fmt(amount, currency)}/month</span>
            <button onClick={() => setStep(1)} style={styles.changeBtn}>Change plan</button>
          </div>

          <div style={styles.twoCol}>
            {/* Left — bank details */}
            <div style={styles.bankCard}>
              <h3 style={styles.bankTitle}>
                {currency === "INR" ? "🇮🇳 NEFT / RTGS / IMPS" : `🌍 SWIFT Wire — ${currency}`}
              </h3>
              <div style={styles.amountHighlight}>
                Transfer exactly <strong style={{ color: "#4F8EF7" }}>{fmt(amount, currency)}</strong>
              </div>
              {currency === "INR"
                ? <InrSection methods={methods} />
                : <SwiftSection methods={methods} currency={currency} />}
            </div>

            {/* Right — instructions */}
            <div style={styles.instructCard}>
              <h4 style={styles.instrTitle}>How it works</h4>
              <div style={styles.instrStep}>
                <div style={styles.instrNum}>1</div>
                <div>Copy the bank details on the left</div>
              </div>
              <div style={styles.instrStep}>
                <div style={styles.instrNum}>2</div>
                <div>Transfer <strong>{fmt(amount, currency)}</strong> from your bank app or net banking</div>
              </div>
              <div style={styles.instrStep}>
                <div style={styles.instrNum}>3</div>
                <div>Save your UTR / wire reference number</div>
              </div>
              <div style={styles.instrStep}>
                <div style={styles.instrNum}>4</div>
                <div>Click "I've Transferred" and enter your reference</div>
              </div>
              <div style={styles.instrStep}>
                <div style={styles.instrNum}>5</div>
                <div>We verify and activate within <strong>24 hours</strong></div>
              </div>
              <div style={styles.trustBadge}>
                <span>🔒</span>
                <div>
                  <strong style={{ display: "block", fontSize: 13, color: "#fff" }}>Secure & Private</strong>
                  <span style={{ fontSize: 12 }}>Direct bank-to-bank. Zero intermediary fees. Your transfer reference is encrypted.</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.btnRow}>
            <button onClick={() => setStep(1)} style={styles.backBtn}>← Back</button>
            <button onClick={() => setStep(3)} style={styles.primaryBtn}>
              I've Transferred — Enter Reference →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Confirm ── */}
      {step === 3 && (
        <div style={styles.section}>
          <div style={styles.summaryBar}>
            <span>{plan.name} — {fmt(amount, currency)}/month · {currency === "INR" ? "NEFT/RTGS" : `SWIFT ${currency}`}</span>
            <button onClick={() => setStep(2)} style={styles.changeBtn}>Edit</button>
          </div>

          <div style={styles.confirmGrid}>
            <div>
              <label style={styles.label}>Full Name *</label>
              <input name="buyer_name" value={form.buyer_name} onChange={handleInput}
                placeholder="As per bank records" style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Work Email *</label>
              <input name="buyer_email" value={form.buyer_email} onChange={handleInput}
                placeholder="you@company.com" style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Company Name</label>
              <input name="buyer_company" value={form.buyer_company} onChange={handleInput}
                placeholder="Optional" style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Phone (WhatsApp preferred)</label>
              <input name="buyer_phone" value={form.buyer_phone} onChange={handleInput}
                placeholder="+91 98765 43210" style={styles.input} />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={styles.label}>
              UTR / Wire Reference Number *
              <span style={{ color: "#666", fontWeight: 400, marginLeft: 8 }}>
                (from your bank after transfer)
              </span>
            </label>
            <input
              name="transfer_ref"
              value={form.transfer_ref}
              onChange={handleInput}
              placeholder="e.g. UTR123456789012 or SWIFT/CHIPS ref"
              style={{ ...styles.input, fontFamily: "monospace", letterSpacing: "0.05em" }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={styles.label}>Notes (optional)</label>
            <textarea name="notes" value={form.notes} onChange={handleInput}
              placeholder="Anything we should know…"
              rows={3}
              style={{ ...styles.input, resize: "vertical", minHeight: 72 }} />
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.btnRow}>
            <button onClick={() => setStep(2)} style={styles.backBtn}>← Back</button>
            <button onClick={handleSubmit} disabled={submitting}
              style={{ ...styles.primaryBtn, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Submitting…" : "Confirm Payment →"}
            </button>
          </div>

          <p style={styles.finePrint}>
            By confirming, you agree to the Nanoneuron Terms of Service. Your account is activated within 24 hours of bank verification. Reach us at service@nanoneuron.ai for any questions.
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <span>Nanoneuron Services · GST 27EPIPM6974Q1Z0 · Mumbai, India</span>
        <span>·</span>
        <a href="mailto:service@nanoneuron.ai" style={{ color: "#4F8EF7" }}>service@nanoneuron.ai</a>
        <span>·</span>
        <a href="/dashboard" style={{ color: "#555" }}>Back to Dashboard</a>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#08080F",
    color: "#fff",
    fontFamily: "'Inter', -apple-system, sans-serif",
    paddingBottom: 80,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
    borderBottom: "1px solid #111",
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    textDecoration: "none",
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  headerTag: {
    fontSize: 12,
    color: "#555",
    background: "#111",
    padding: "4px 12px",
    borderRadius: 20,
    border: "1px solid #1E1E2E",
  },
  hero: {
    textAlign: "center",
    padding: "60px 20px 30px",
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: 900,
    margin: 0,
    letterSpacing: "-1px",
    background: "linear-gradient(135deg, #fff 0%, #888 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: 16,
    color: "#666",
    marginTop: 14,
    lineHeight: 1.7,
  },
  steps: {
    display: "flex",
    justifyContent: "center",
    gap: 32,
    padding: "20px 0 40px",
    flexWrap: "wrap",
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    transition: "all 0.2s",
  },
  section: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 24px",
  },
  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 20,
    marginBottom: 32,
  },
  planCard: {
    border: "2px solid",
    borderRadius: 16,
    padding: "28px 24px",
    position: "relative",
    transition: "all 0.2s",
  },
  badge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 10,
    fontWeight: 800,
    padding: "3px 12px",
    borderRadius: 20,
    letterSpacing: "0.08em",
    color: "#fff",
  },
  planDot: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "2px solid",
    marginBottom: 14,
    transition: "all 0.2s",
  },
  planName: {
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 8px",
  },
  planPrice: {
    display: "flex",
    alignItems: "baseline",
    marginBottom: 4,
  },
  featureList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  featureItem: {
    fontSize: 13,
    color: "#bbb",
    padding: "4px 0",
    display: "flex",
    alignItems: "flex-start",
  },
  currencyRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  currencyGroup: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  currBtn: {
    padding: "7px 16px",
    borderRadius: 8,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "#111",
    borderRadius: 12,
    marginBottom: 24,
    border: "1px solid #1E1E2E",
  },
  totalAmt: {
    fontSize: 24,
    fontWeight: 800,
    color: "#fff",
  },
  primaryBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: 12,
    border: "none",
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
    background: "#4F8EF7",
    transition: "opacity 0.15s",
  },
  summaryBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    background: "#111",
    borderRadius: 10,
    marginBottom: 24,
    fontSize: 14,
    color: "#aaa",
    border: "1px solid #1E1E2E",
  },
  changeBtn: {
    background: "none",
    border: "none",
    color: "#4F8EF7",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    marginBottom: 28,
  },
  bankCard: {
    background: "#0D0D1A",
    border: "1px solid #1E1E2E",
    borderRadius: 16,
    padding: 28,
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: "0 0 16px",
  },
  amountHighlight: {
    background: "#111",
    border: "1px solid #2A2A3E",
    borderRadius: 8,
    padding: "10px 16px",
    fontSize: 14,
    marginBottom: 20,
    color: "#ccc",
  },
  bankNote: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
    lineHeight: 1.6,
  },
  field: {
    display: "flex",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #111",
    gap: 8,
  },
  fieldLabel: {
    color: "#555",
    fontSize: 12,
    minWidth: 120,
  },
  fieldVal: {
    color: "#e0e0e0",
    fontSize: 13,
    fontFamily: "monospace",
    flex: 1,
    wordBreak: "break-all",
  },
  copyBtn: {
    background: "#1E1E2E",
    border: "1px solid #2A2A3E",
    color: "#4F8EF7",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  tipBox: {
    marginTop: 16,
    padding: "10px 14px",
    background: "#4F8EF710",
    border: "1px solid #4F8EF730",
    borderRadius: 8,
    fontSize: 12,
    color: "#4F8EF7",
    lineHeight: 1.6,
  },
  instructCard: {
    background: "#0D0D1A",
    border: "1px solid #1E1E2E",
    borderRadius: 16,
    padding: 28,
  },
  instrTitle: {
    fontSize: 15,
    fontWeight: 700,
    margin: "0 0 20px",
    color: "#ddd",
  },
  instrStep: {
    display: "flex",
    gap: 14,
    marginBottom: 16,
    fontSize: 13,
    color: "#bbb",
    lineHeight: 1.5,
    alignItems: "flex-start",
  },
  instrNum: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#1E1E2E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#4F8EF7",
    flexShrink: 0,
  },
  trustBadge: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    marginTop: 24,
    padding: "14px",
    background: "#22C55E10",
    border: "1px solid #22C55E30",
    borderRadius: 10,
    fontSize: 12,
    color: "#888",
    lineHeight: 1.5,
  },
  confirmGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#888",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    width: "100%",
    background: "#0D0D1A",
    border: "1px solid #1E1E2E",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#fff",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  },
  errorBox: {
    marginTop: 16,
    padding: "12px 16px",
    background: "#EF444420",
    border: "1px solid #EF444440",
    borderRadius: 8,
    color: "#FCA5A5",
    fontSize: 13,
  },
  btnRow: {
    display: "flex",
    gap: 12,
    marginTop: 24,
  },
  backBtn: {
    padding: "16px 24px",
    borderRadius: 12,
    border: "1px solid #1E1E2E",
    background: "transparent",
    color: "#888",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  finePrint: {
    fontSize: 12,
    color: "#444",
    marginTop: 20,
    lineHeight: 1.7,
    textAlign: "center",
  },
  successCard: {
    maxWidth: 520,
    margin: "100px auto",
    textAlign: "center",
    padding: "0 24px",
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#22C55E20",
    border: "2px solid #22C55E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    color: "#22C55E",
    margin: "0 auto 28px",
  },
  successTitle: {
    fontSize: 36,
    fontWeight: 900,
    margin: "0 0 16px",
    letterSpacing: "-0.5px",
  },
  successSub: {
    fontSize: 16,
    color: "#888",
    lineHeight: 1.7,
    marginBottom: 28,
  },
  refBox: {
    background: "#111",
    border: "1px solid #1E1E2E",
    borderRadius: 12,
    padding: "16px 24px",
    marginBottom: 24,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  refCode: {
    fontFamily: "monospace",
    fontSize: 18,
    color: "#4F8EF7",
    fontWeight: 700,
    letterSpacing: "0.05em",
  },
  successNote: {
    fontSize: 14,
    color: "#666",
    lineHeight: 1.7,
    marginBottom: 28,
  },
  dashBtn: {
    display: "inline-block",
    padding: "14px 32px",
    background: "#4F8EF7",
    borderRadius: 10,
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
    fontSize: 15,
  },
  footer: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    alignItems: "center",
    padding: "40px 20px",
    borderTop: "1px solid #111",
    marginTop: 60,
    fontSize: 13,
    color: "#555",
    flexWrap: "wrap",
  },
};
