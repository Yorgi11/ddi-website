import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import TextInput from "../components/TextInput";
import { getDerivedCurrentLevel } from "../lib/profileProgress";

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

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      setMessage("Payment not found.");
      setSubmitting(false);
      return;
    }

    if (data.status === "confirmed") {
      setMessage("This payment is already confirmed.");
      setSubmitting(false);
      return;
    }

    if (data.confirmation_code !== code.trim()) {
      setMessage("Invalid confirmation code.");
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update({ status: "confirmed" })
      .eq("id", paymentId)
      .eq("user_id", user.id);

    if (updateError) {
      setMessage(updateError.message);
      setSubmitting(false);
      return;
    }

    const { data: profileData, error: profileFetchError } = await supabase
      .from("profiles")
      .select("levels_paid_for, current_level")
      .eq("id", user.id)
      .single();

    if (profileFetchError) {
      setMessage(profileFetchError.message);
      setSubmitting(false);
      return;
    }

    const existingLevels = profileData?.levels_paid_for ?? [];
    const nextLevels = existingLevels.includes(data.program_id)
      ? existingLevels
      : [...existingLevels, data.program_id];

    const nextProfile = {
      ...profileData,
      levels_paid_for: nextLevels,
    };

    const nextCurrentLevel = getDerivedCurrentLevel(nextProfile);

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        levels_paid_for: nextLevels,
        current_level: nextCurrentLevel,
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      setMessage(profileUpdateError.message);
      setSubmitting(false);
      return;
    }

    const { error: statusError } = await supabase.from("program_status").upsert(
      {
        user_id: user.id,
        program_id: data.program_id,
        status: "paid",
      },
      { onConflict: "user_id,program_id" },
    );

    if (statusError) {
      setMessage(statusError.message);
      setSubmitting(false);
      return;
    }
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
