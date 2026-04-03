import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import TextInput from "../components/TextInput";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import { getDerivedCurrentLevel } from "../lib/profileProgress";

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

  async function markLevelComplete(level) {
    if (!selectedProfile) {
      setMessage("Load a profile first.");
      return;
    }

    const completedLevels = selectedProfile.completed_levels ?? [];
    const nextCompleted = completedLevels.includes(level)
      ? completedLevels
      : [...completedLevels, level];

    const nextProfile = {
      ...selectedProfile,
      completed_levels: nextCompleted,
    };

    const nextCurrentLevel = getDerivedCurrentLevel(nextProfile);

    const profileUpdated = await updateProfile(
      {
        completed_levels: nextCompleted,
        current_level: nextCurrentLevel,
      },
      `${level} marked as completed.`,
    );

    if (!profileUpdated) return;

    const { error: statusError } = await supabase.from("program_status").upsert(
      {
        user_id: selectedProfile.id,
        program_id: level,
        status: "completed",
      },
      { onConflict: "user_id,program_id" },
    );

    if (statusError) {
      setMessage(statusError.message);
      return;
    }
  }

  async function grantPlacementAccess(level) {
    if (!selectedProfile) {
      setMessage("Load a profile first.");
      return;
    }

    const placementAccess = selectedProfile.placement_access ?? [];
    const nextPlacement = placementAccess.includes(level)
      ? placementAccess
      : [...placementAccess, level];

    const nextProfile = {
      ...selectedProfile,
      placement_access: nextPlacement,
    };

    const nextCurrentLevel = getDerivedCurrentLevel(nextProfile);

    await updateProfile(
      {
        placement_access: nextPlacement,
        current_level: nextCurrentLevel,
      },
      `Placement access granted for ${level}.`,
    );
  }

  async function revokePlacementAccess(level) {
    if (!selectedProfile) {
      setMessage("Load a profile first.");
      return;
    }

    const placementAccess = selectedProfile.placement_access ?? [];
    const nextPlacement = placementAccess.filter((item) => item !== level);

    const nextProfile = {
      ...selectedProfile,
      placement_access: nextPlacement,
    };

    const nextCurrentLevel = getDerivedCurrentLevel(nextProfile);

    await updateProfile(
      {
        placement_access: nextPlacement,
        current_level: nextCurrentLevel,
      },
      `Placement access removed for ${level}.`,
    );
  }

  async function removeCompletedLevel(level) {
    if (!selectedProfile) {
      setMessage("Load a profile first.");
      return;
    }

    const completedLevels = selectedProfile.completed_levels ?? [];
    const nextCompleted = completedLevels.filter((item) => item !== level);

    const nextProfile = {
      ...selectedProfile,
      completed_levels: nextCompleted,
    };

    const nextCurrentLevel = getDerivedCurrentLevel(nextProfile);

    const profileUpdated = await updateProfile(
      {
        completed_levels: nextCompleted,
        current_level: nextCurrentLevel,
      },
      `${level} removed from completed levels.`,
    );

    if (!profileUpdated) return;

    const paidLevels = selectedProfile.levels_paid_for ?? [];
    const nextStatus = paidLevels.includes(level) ? "paid" : "not_started";

    const { error: statusError } = await supabase.from("program_status").upsert(
      {
        user_id: selectedProfile.id,
        program_id: level,
        status: nextStatus,
      },
      { onConflict: "user_id,program_id" },
    );

    if (statusError) {
      setMessage(statusError.message);
      return;
    }
  }

  return (
    <PageContainer>
      <div className={va.spacing.pageStack}>
        <SectionCard
          title="Admin"
          description="Load a user profile and manage level completion or placement access."
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
                <div>Current Level: {selectedProfile.current_level ?? 1}</div>
                <div>
                  Levels Paid For:{" "}
                  {selectedProfile.levels_paid_for?.join(", ") || "None"}
                </div>
                <div>
                  Completed Levels:{" "}
                  {selectedProfile.completed_levels?.join(", ") || "None"}
                </div>
                <div>
                  Placement Access:{" "}
                  {selectedProfile.placement_access?.join(", ") || "None"}
                </div>
                <div>Admin: {selectedProfile.is_admin ? "Yes" : "No"}</div>
              </div>
            </SectionCard>

            <SectionCard
              title="Completion Controls"
              description="Mark or remove completed levels."
            >
              <div className={va.spacing.sectionStack}>
                <PrimaryButton
                  fullWidth
                  onClick={() => markLevelComplete("level1")}
                  disabled={loading}
                >
                  Mark Level 1 Complete
                </PrimaryButton>

                <PrimaryButton
                  fullWidth
                  onClick={() => markLevelComplete("level2")}
                  disabled={loading}
                >
                  Mark Level 2 Complete
                </PrimaryButton>

                <PrimaryButton
                  fullWidth
                  onClick={() => markLevelComplete("level3")}
                  disabled={loading}
                >
                  Mark Level 3 Complete
                </PrimaryButton>

                <SecondaryButton
                  fullWidth
                  onClick={() => removeCompletedLevel("level1")}
                >
                  Remove Level 1 Completion
                </SecondaryButton>

                <SecondaryButton
                  fullWidth
                  onClick={() => removeCompletedLevel("level2")}
                >
                  Remove Level 2 Completion
                </SecondaryButton>

                <SecondaryButton
                  fullWidth
                  onClick={() => removeCompletedLevel("level3")}
                >
                  Remove Level 3 Completion
                </SecondaryButton>
              </div>
            </SectionCard>

            <SectionCard
              title="Placement Controls"
              description="Grant or revoke placement-based access."
            >
              <div className={va.spacing.sectionStack}>
                <PrimaryButton
                  fullWidth
                  onClick={() => grantPlacementAccess("level2")}
                  disabled={loading}
                >
                  Grant Placement Access Level 2
                </PrimaryButton>

                <PrimaryButton
                  fullWidth
                  onClick={() => grantPlacementAccess("level3")}
                  disabled={loading}
                >
                  Grant Placement Access Level 3
                </PrimaryButton>

                <SecondaryButton
                  fullWidth
                  onClick={() => revokePlacementAccess("level2")}
                >
                  Revoke Placement Access Level 2
                </SecondaryButton>

                <SecondaryButton
                  fullWidth
                  onClick={() => revokePlacementAccess("level3")}
                >
                  Revoke Placement Access Level 3
                </SecondaryButton>
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </PageContainer>
  );
}
