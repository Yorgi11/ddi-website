import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";

export default function ETransferPage() {
  const { paymentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPayment() {
      if (!user || !paymentId) return;

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setPayment(data);
      setLoading(false);
    }

    loadPayment();
  }, [paymentId, user]);

  if (loading) {
    return (
      <PageContainer>
        <SectionCard title="e-Transfer" description="Loading payment details.">
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            Loading...
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  if (!payment) {
    return (
      <PageContainer>
        <SectionCard title="e-Transfer" description="Payment not found.">
          <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
            {message || "Unable to load payment."}
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionCard
        title="e-Transfer Instructions"
        description="Send the payment using the exact amount and reference code below."
      >
        <div className={va.spacing.sectionStack}>
          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
            Recipient: payments@digitaldevelopmentinstitute.com
          </div>

          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
            Amount: ${Number(payment.total).toFixed(2)} CAD
          </div>

          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
            Item:{" "}
            {payment.class_section_id ||
              payment.course_level_id ||
              payment.course_id ||
              "Course payment"}
          </div>

          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
            Reference Code: {payment.reference_code}
          </div>

          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            Put the reference code in the message field of your e-Transfer.
          </div>

          <PrimaryButton
            fullWidth
            onClick={() => navigate(`/payment-confirm/${payment.id}`)}
          >
            I sent the e-Transfer
          </PrimaryButton>

          <SecondaryButton fullWidth onClick={() => navigate("/account")}>
            Back to account
          </SecondaryButton>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
