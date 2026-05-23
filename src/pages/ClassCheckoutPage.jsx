import { useEffect, useMemo, useState } from "react";
import { CreditCard, Landmark, WalletCards } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { calcTotals, currency } from "../lib/money";
import { fetchClassSection } from "../lib/lmsApi";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import TextInput from "../components/TextInput";

const PAYMENT_METHODS = [
  {
    id: "etransfer",
    label: "e-Transfer",
    description: "Send payment manually through your bank.",
    icon: Landmark,
  },
  {
    id: "stripe",
    label: "Credit or Debit",
    description: "Pay online through Stripe Checkout.",
    icon: CreditCard,
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Pay online with your PayPal account.",
    icon: WalletCards,
  },
];

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ClassCheckoutPage() {
  const { classSectionId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [section, setSection] = useState(null);
  const [loadMessage, setLoadMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [agreed, setAgreed] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");

  useEffect(() => {
    async function loadSection() {
      const { section: sectionData, error } =
        await fetchClassSection(classSectionId);

      setSection(sectionData);
      setLoadMessage(error ? error.message : "");
    }

    loadSection();
  }, [classSectionId]);

  const basePrice = Number(section?.price_cents || 0) / 100;
  const totals = useMemo(
    () => calcTotals(basePrice, paymentMethod),
    [basePrice, paymentMethod],
  );

  async function startOnlinePayment(paymentId) {
    const endpoint =
      paymentMethod === "stripe"
        ? "/create-checkout-session"
        : "/create-paypal-order";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentId }),
    });
    const providerData = await response.json();

    if (!response.ok) {
      throw new Error(providerData.error || "Unable to start online payment.");
    }

    window.location.assign(providerData.url);
  }

  async function handleCheckout() {
    if (!section || !user) return;

    setSubmitting(true);
    setCheckoutMessage("");

    try {
      if (
        !firstName.trim() ||
        !lastName.trim() ||
        !email.trim() ||
        !username.trim()
      ) {
        throw new Error("Please complete all buyer information fields.");
      }

      if (!agreed) {
        throw new Error("Please accept the sales terms before continuing.");
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error("Please log in before checking out.");
      }

      const response = await fetch("/create-class-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classSectionId: section.id,
          paymentMethod,
          firstName,
          lastName,
          email,
          username,
        }),
      });
      const checkoutData = await response.json();

      if (!response.ok) {
        throw new Error(checkoutData.error || "Unable to create checkout.");
      }

      if (paymentMethod === "etransfer") {
        navigate(`/etransfer/${checkoutData.paymentId}`);
        return;
      }

      await startOnlinePayment(checkoutData.paymentId);
    } catch (error) {
      setCheckoutMessage(error.message || "Unable to create checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedMethod = PAYMENT_METHODS.find(
    (method) => method.id === paymentMethod,
  );

  if (!section) {
    return (
      <PageContainer>
        <SectionCard title="Class Checkout" description="Loading class section.">
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            {loadMessage || "Loading..."}
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className={va.layout.checkoutGrid}>
        <SectionCard
          title="Class Checkout"
          description={`${section.course?.title ?? "Course"} / ${
            section.course_level?.title ?? "Class level"
          }`}
        >
          <div className={va.spacing.stackGap}>
            <div className={va.layout.infoList}>
              <div>Section: {section.title}</div>
              <div>Delivery: {section.delivery_mode}</div>
              <div>Starts: {formatDate(section.starts_at)}</div>
            </div>

            <div className={va.layout.inputGridTwo}>
              <TextInput
                placeholder="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                fullWidth={false}
              />
              <TextInput
                placeholder="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                fullWidth={false}
              />
              <div className={va.layout.spanTwo}>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className={va.layout.spanTwo}>
                <TextInput
                  placeholder="Username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {PAYMENT_METHODS.map((method) => {
                const active = paymentMethod === method.id;
                const Icon = method.icon;

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`${va.forms.choiceButton} ${
                      active ? va.forms.activeRing : ""
                    }`}
                    style={{
                      backgroundColor: active
                        ? va.colors.primaryColor
                        : va.colors.surfaceColor,
                      borderColor: active
                        ? va.colors.primaryColor
                        : va.colors.borderColor,
                      color: active
                        ? va.colors.secondaryText
                        : va.colors.primaryText,
                    }}
                  >
                    <Icon className={va.icons.medium} />
                    <div
                      className={`${va.spacing.marginTopSmall} ${va.text.strongText}`}
                    >
                      {method.label}
                    </div>
                    <div
                      className={`${va.spacing.marginTopSmall} ${va.text.smallFont}`}
                      style={{
                        color: active
                          ? va.colors.secondaryTextDark
                          : va.colors.primaryTextDark,
                      }}
                    >
                      {method.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <label
              className={va.forms.checkboxPanel}
              style={{
                backgroundColor: va.colors.surfaceColor,
                borderColor: va.colors.borderColor,
                color: va.colors.primaryText,
              }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <div>
                <div className={va.text.strongText}>Sales agreement</div>
                <div
                  className={va.text.smallFont}
                  style={{ color: va.colors.primaryTextDark }}
                >
                  I agree to the sales terms, refund terms, and class
                  enrollment requirements.
                </div>
              </div>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Order Summary" description={section.title}>
          <div className={va.layout.contactList}>
            <div className={va.layout.splitRow}>
              <span>Class</span>
              <span className={va.text.strongText}>
                {section.course_level?.title}
              </span>
            </div>
            <div className={va.layout.splitRow}>
              <span>Subtotal</span>
              <span>{currency(totals.subtotal)}</span>
            </div>
            <div className={va.layout.splitRow}>
              <span>Tax</span>
              <span>{currency(totals.tax)}</span>
            </div>
            <div className={va.layout.splitRow}>
              <span>{selectedMethod?.label} fee</span>
              <span>{currency(totals.methodFee)}</span>
            </div>
            <div
              className={va.layout.borderedTopRow}
              style={{ borderColor: va.colors.borderColor }}
            >
              <span>Total</span>
              <span>{currency(totals.total)}</span>
            </div>
            <PrimaryButton
              fullWidth
              onClick={handleCheckout}
              disabled={!agreed || submitting || section.status !== "open"}
            >
              {submitting
                ? "Processing..."
                : paymentMethod === "etransfer"
                  ? "Continue to e-Transfer"
                  : `Pay with ${selectedMethod?.label}`}
            </PrimaryButton>
            <SecondaryButton
              fullWidth
              onClick={() => navigate(`/dashboard/courses/${section.course?.slug}`)}
            >
              Back to Course
            </SecondaryButton>
            {checkoutMessage && (
              <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
                {checkoutMessage}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
