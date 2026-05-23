import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import TextInput from "../components/TextInput";

export default function PaymentConfirmPage() {
  const { paymentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (!user || !paymentId) return;

    setSubmitting(true);
    setMessage("");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setMessage("Please log in before confirming payment.");
      setSubmitting(false);
      return;
    }

    const response = await fetch("/confirm-manual-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentId,
        confirmationCode: code.trim(),
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Unable to confirm payment.");
      setSubmitting(false);
      return;
    }

    setMessage("Payment confirmed. Your access has been updated.");
    setSubmitting(false);
    navigate("/dashboard");
  }

  return (
    <PageContainer>
      <SectionCard
        title="Confirm Payment"
        description="Enter the confirmation code you received."
      >
        <div className={va.spacing.sectionStack}>
          <TextInput
            placeholder="Confirmation code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <PrimaryButton
            fullWidth
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Confirming..." : "Confirm Payment"}
          </PrimaryButton>

          {message && (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              {message}
            </div>
          )}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
