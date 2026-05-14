import { useMemo, useState } from "react";
import { CreditCard, Landmark, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { calcTotals, currency } from "../lib/money";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import TextInput from "../components/TextInput";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  generateReferenceCode,
  generateConfirmationCode,
} from "../lib/paymentHelpers";
import {
  canAccessProgram,
  getProgramAccessMessage,
} from "../lib/programAccess";

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

export default function CheckoutPage({ program }) {
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [agreed, setAgreed] = useState(false);

  const { user, profile } = useAuth();
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");

  const navigate = useNavigate();

  const totals = useMemo(
    () => calcTotals(program?.price ?? 0, paymentMethod),
    [program, paymentMethod],
  );

  const hasAccess = canAccessProgram(program?.id, profile);
  const accessMessage = getProgramAccessMessage(program?.id, profile);

  if (!program) return null;

  if (!hasAccess) {
    return (
      <PageContainer>
        <SectionCard
          title="Checkout Unavailable"
          description="You do not currently meet the entry requirements for this program."
        >
          <div className={va.spacing.sectionStack}>
            <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
              {accessMessage}
            </div>

            <SecondaryButton
              fullWidth
              onClick={() => navigate(`/programs/${program.id}`)}
            >
              Back to program
            </SecondaryButton>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

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
    if (!user || !program) return;

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

      const isETransfer = paymentMethod === "etransfer";
      const referenceCode = isETransfer
        ? generateReferenceCode(program.id, user.id)
        : null;
      const confirmationCode = isETransfer
        ? generateConfirmationCode()
        : null;

      const { data, error } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          program_id: program.id,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          payment_method: paymentMethod,
          reference_code: referenceCode,
          confirmation_code: confirmationCode,
          status: "pending",
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          username: username.trim(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (isETransfer) {
        navigate(`/etransfer/${data.id}`);
        return;
      }

      await startOnlinePayment(data.id);
    } catch (error) {
      setCheckoutMessage(error.message || "Unable to create checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedMethod = PAYMENT_METHODS.find(
    (method) => method.id === paymentMethod,
  );

  return (
    <PageContainer>
      <div className={va.layout.checkoutGrid}>
        <SectionCard
          title="Checkout"
          description="Add buyer details, choose a payment method, and review the final total."
        >
          <div className={va.spacing.stackGap}>
            <div className={va.layout.inputGridTwo}>
              <TextInput
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth={false}
              />
              <TextInput
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth={false}
              />
              <div className={va.layout.spanTwo}>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className={va.layout.spanTwo}>
                <TextInput
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className={va.spacing.sectionStack}>
              <h3
                className={va.text.strongText}
                style={{ color: va.colors.primaryText }}
              >
                Payment method
              </h3>

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
                      <div className={`${va.spacing.marginTopSmall} ${va.text.strongText}`}>
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
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <div>
                <div className={va.text.strongText}>Sales agreement</div>
                <div
                  className={va.text.smallFont}
                  style={{ color: va.colors.primaryTextDark }}
                >
                  I agree to the sales terms, refund terms, and placement
                  requirements.
                </div>
              </div>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Order Summary" description={program.name}>
          <div className={va.layout.contactList}>
            <div className={va.layout.splitRow}>
              <span>Program</span>
              <span className={va.text.strongText}>{program.timeline}</span>
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
              disabled={!agreed || submitting}
            >
              {submitting
                ? "Processing..."
                : paymentMethod === "etransfer"
                  ? "Continue to e-Transfer"
                  : `Pay with ${selectedMethod?.label}`}
            </PrimaryButton>

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
