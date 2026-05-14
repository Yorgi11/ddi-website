import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import PrimaryButton from "../components/PrimaryButton";
import SectionCard from "../components/SectionCard";
import { visualAid as va } from "../config/visualAid";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying your payment...");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyPayment() {
      const provider = searchParams.get("provider");
      const paymentId = searchParams.get("payment_id");
      const sessionId = searchParams.get("session_id");
      const orderId = searchParams.get("token");

      if (!provider || !paymentId) {
        setStatus("Missing payment details. Please contact support.");
        return;
      }

      try {
        const response = await fetch("/verify-online-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider,
            paymentId,
            sessionId,
            orderId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to verify payment.");
        }

        if (!isMounted) return;

        setVerified(true);
        setStatus("Payment confirmed. Your program access is being updated.");
      } catch (error) {
        if (!isMounted) return;
        setStatus(error.message || "Unable to verify payment.");
      }
    }

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  return (
    <PageContainer>
      <SectionCard
        title={verified ? "Payment Confirmed" : "Payment Verification"}
        description={status}
      >
        <div className={va.spacing.sectionStack}>
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            {verified
              ? "You can now return to your dashboard."
              : "If this message does not update, refresh this page or contact support."}
          </div>

          <PrimaryButton fullWidth onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </PrimaryButton>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
