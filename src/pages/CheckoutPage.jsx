import { useMemo, useState } from "react";
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

export default function CheckoutPage({ program }) {
  const [paymentMethod, setPaymentMethod] = useState("etransfer");
  const [agreed, setAgreed] = useState(false);
  const [captcha, setCaptcha] = useState(false);

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

  async function handleCheckout() {
    if (!user || !program) return;

    setSubmitting(true);
    setCheckoutMessage("");

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !username.trim()
    ) {
      setCheckoutMessage("Please complete all buyer information fields.");
      setSubmitting(false);
      return;
    }

    const referenceCode =
      paymentMethod === "etransfer"
        ? generateReferenceCode(program.id, user.id)
        : null;

    const confirmationCode =
      paymentMethod === "etransfer" ? generateConfirmationCode() : null;

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
        first_name: firstName,
        last_name: lastName,
        email: email,
        username: username,
      })
      .select()
      .single();

    if (error) {
      setCheckoutMessage(error.message);
      setSubmitting(false);
      return;
    }

    if (paymentMethod === "etransfer") {
      navigate(`/etransfer/${data.id}`);
    } else if (paymentMethod === "stripe") {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ programId: program.id }),
      });

      const { url } = await res.json();
      window.location.href = url;
    }

    setSubmitting(false);
  }

  return (
    <PageContainer>
      <div className={va.layout.checkoutGrid}>
        <SectionCard
          title="Payment Page"
          description="Buyer information, payment method, agreement, captcha, and final total."
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
                Payment method choice
              </h3>

              <div className={va.layout.paymentMethodGrid}>
                <button
                  onClick={() => setPaymentMethod("etransfer")}
                  className={`${va.buttons.optionButton} ${
                    paymentMethod === "etransfer" ? va.forms.activeRing : ""
                  }`}
                  style={{
                    backgroundColor: va.colors.surfaceColor,
                    color: va.colors.primaryText,
                    borderColor:
                      paymentMethod === "etransfer"
                        ? va.colors.primaryColor
                        : va.colors.borderColor,
                  }}
                >
                  <div className={va.text.strongText}>e-Transfer</div>
                  <div
                    className={va.text.smallFont}
                    style={{ color: va.colors.primaryTextDark }}
                  >
                    Standard pricing
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod("stripe")}
                  className={`${va.buttons.optionButton} ${
                    paymentMethod === "stripe" ? va.forms.activeRing : ""
                  }`}
                  style={{
                    backgroundColor: va.colors.surfaceColor,
                    color: va.colors.primaryText,
                    borderColor:
                      paymentMethod === "stripe"
                        ? va.colors.primaryColor
                        : va.colors.borderColor,
                  }}
                >
                  <div className={va.text.strongText}>Card (Stripe)</div>
                  <div
                    className={va.text.smallFont}
                    style={{ color: va.colors.primaryTextDark }}
                  >
                    Stripe fee added
                  </div>
                </button>
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
                checked={captcha}
                onChange={(e) => setCaptcha(e.target.checked)}
              />
              <div>
                <div className={va.text.strongText}>Captcha placeholder</div>
                <div
                  className={va.text.smallFont}
                  style={{ color: va.colors.primaryTextDark }}
                >
                  Replace this with Cloudflare Turnstile.
                </div>
              </div>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Order Summary" description={program.name}>
          <div className={va.layout.contactList}>
            <div className={va.layout.splitRow}>
              <span>Subtotal</span>
              <span>{currency(totals.subtotal)}</span>
            </div>
            <div className={va.layout.splitRow}>
              <span>Tax</span>
              <span>{currency(totals.tax)}</span>
            </div>
            <div className={va.layout.splitRow}>
              <span>Payment fee</span>
              <span>{currency(totals.methodFee)}</span>
            </div>

            <div
              className={va.layout.borderedTopRow}
              style={{ borderColor: va.colors.borderColor }}
            >
              <span>Total cost including taxes</span>
              <span>{currency(totals.total)}</span>
            </div>

            <PrimaryButton
              fullWidth
              onClick={handleCheckout}
              disabled={!agreed || !captcha || submitting}
            >
              {submitting
                ? "Submitting..."
                : paymentMethod === "stripe"
                  ? "Pay now"
                  : "Continue to e-Transfer"}
            </PrimaryButton>

            {checkoutMessage && (
              <div
                style={{
                  ...va.textStyles.bodyTextThin(va.colors.primaryTextDark),
                }}
              >
                {checkoutMessage}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
