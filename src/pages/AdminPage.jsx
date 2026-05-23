import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import TextInput from "../components/TextInput";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import AdminLmsManager from "../components/admin/AdminLmsManager";

export default function AdminPage() {
  const { profile } = useAuth();

  const [email, setEmail] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setMessage("");
    setSelectedProfile(null);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email.trim())
      .single();

    if (error || !data) {
      setMessage("Profile not found.");
      setLoading(false);
      return;
    }

    setSelectedProfile(data);
    setMessage("Profile loaded.");
    setLoading(false);
  }

  async function updateProfile(patch, successMessage) {
    if (!selectedProfile) {
      setMessage("Load a profile first.");
      return false;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", selectedProfile.id);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return false;
    }

    const { data, error: reloadError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", selectedProfile.id)
      .single();

    if (!reloadError && data) {
      setSelectedProfile(data);
    }

    setMessage(successMessage);
    setLoading(false);
    return true;
  }

  return (
    <PageContainer>
      <div className={va.spacing.pageStack}>
        <SectionCard
          title="Admin"
          description="Load a user profile, manage roles, and maintain LMS courses."
        >
          <div className={va.spacing.sectionStack}>
            {profile?.is_admin && (
              <div
                style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}
              >
                Admin access granted.
              </div>
            )}

            <TextInput
              placeholder="User email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PrimaryButton fullWidth onClick={loadProfile} disabled={loading}>
              {loading ? "Loading..." : "Load Profile"}
            </PrimaryButton>

            {message && (
              <div
                style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}
              >
                {message}
              </div>
            )}
          </div>
        </SectionCard>

        {selectedProfile && (
          <>
            <SectionCard
              title="Selected User"
              description="Current user profile data."
            >
              <div
                className={va.layout.infoList}
                style={{ color: va.colors.primaryTextDark }}
              >
                <div>Username: {selectedProfile.username ?? "None"}</div>
                <div>Email: {selectedProfile.email ?? "None"}</div>
                <div>Admin: {selectedProfile.is_admin ? "Yes" : "No"}</div>
                <div>
                  Instructor: {selectedProfile.is_instructor ? "Yes" : "No"}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Role Controls"
              description="Grant or revoke instructor access for the LMS."
            >
              <div className={va.spacing.sectionStack}>
                <PrimaryButton
                  fullWidth
                  onClick={() =>
                    updateProfile(
                      { is_instructor: true },
                      "Instructor access granted.",
                    )
                  }
                  disabled={loading}
                >
                  Grant Instructor Access
                </PrimaryButton>

                <SecondaryButton
                  fullWidth
                  onClick={() =>
                    updateProfile(
                      { is_instructor: false },
                      "Instructor access revoked.",
                    )
                  }
                >
                  Revoke Instructor Access
                </SecondaryButton>
              </div>
            </SectionCard>

          </>
        )}

        <AdminLmsManager />
      </div>
    </PageContainer>
  );
}
