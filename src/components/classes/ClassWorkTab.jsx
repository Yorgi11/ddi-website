import { useState } from "react";
import { visualAid as va } from "../../config/visualAid";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  calculateAssignmentPercent,
  calculateWeightedFinalGrade,
} from "../../lib/gradeUtils";
import SectionCard from "../SectionCard";
import PrimaryButton from "../PrimaryButton";
import TextInput from "../TextInput";

function formatDate(value) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ClassWorkTab({
  enrollment,
  assignments,
  submissions,
  onSubmitted,
}) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState("");
  const [submittingId, setSubmittingId] = useState(null);

  const submissionByAssignment = new Map(
    submissions.map((submission) => [submission.assignment_id, submission]),
  );
  const grades = assignments.map((assignment) => {
    const submission = submissionByAssignment.get(assignment.id);
    const gradePercent =
      submission?.grade_percent ??
      calculateAssignmentPercent(
        submission?.points_awarded,
        assignment.points_possible,
      );
    return {
      grade_percent: gradePercent,
      weight: assignment.weight,
    };
  });
  const finalGrade = calculateWeightedFinalGrade(grades);

  function updateDraft(assignmentId, patch) {
    setDrafts((current) => ({
      ...current,
      [assignmentId]: {
        text_response: current[assignmentId]?.text_response ?? "",
        link_url: current[assignmentId]?.link_url ?? "",
        file: current[assignmentId]?.file ?? null,
        ...patch,
      },
    }));
  }

  async function openSubmissionFile(storagePath) {
    const { data, error } = await supabase.storage
      .from("assignment-submissions")
      .createSignedUrl(storagePath, 60);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function uploadSubmissionFile(assignment, file) {
    if (!file || !user || !enrollment) return null;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `${user.id}/${enrollment.id}/${assignment.id}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from("assignment-submissions")
      .upload(storagePath, file, {
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return storagePath;
  }

  async function submitAssignment(assignment, existingSubmission) {
    if (!user || !enrollment) return;

    const draft = drafts[assignment.id] ?? {};
    const textResponse =
      draft.text_response ?? existingSubmission?.text_response ?? "";
    const linkUrl = draft.link_url ?? existingSubmission?.link_url ?? "";
    const file = draft.file ?? null;

    if (!textResponse.trim() && !linkUrl.trim() && !file) {
      setMessage("Add a text response, link, or file before submitting.");
      return;
    }

    setSubmittingId(assignment.id);
    setMessage("");

    let storagePath = existingSubmission?.storage_path ?? null;

    try {
      if (file) {
        storagePath = await uploadSubmissionFile(assignment, file);
      }
    } catch (error) {
      setSubmittingId(null);
      setMessage(error.message || "Unable to upload submission file.");
      return;
    }

    const payload = {
      assignment_id: assignment.id,
      enrollment_id: enrollment.id,
      user_id: user.id,
      text_response: textResponse.trim() || null,
      link_url: linkUrl.trim() || null,
      storage_path: storagePath,
      status:
        existingSubmission?.status === "submitted" ||
        existingSubmission?.status === "graded"
          ? "resubmitted"
          : "submitted",
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("assignment_submissions").upsert(
      payload,
      { onConflict: "assignment_id,enrollment_id" },
    );

    setSubmittingId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Assignment submitted.");
    setDrafts((current) => ({
      ...current,
      [assignment.id]: {
        text_response: "",
        link_url: "",
        file: null,
      },
    }));

    if (onSubmitted) {
      onSubmitted();
    }
  }

  return (
    <div className={va.spacing.pageStack}>
      <SectionCard
        title="Current Final Grade"
        description="Calculated from graded assignment work."
      >
        <div className={va.text.pageTitleFont}>
          {finalGrade == null ? "Not graded yet" : `${finalGrade}%`}
        </div>
      </SectionCard>

      <SectionCard title="Assignments" description="Published class work.">
        <div className={va.layout.infoList}>
          {assignments.length > 0 ? (
            assignments.map((assignment) => {
              const submission = submissionByAssignment.get(assignment.id);
              const gradePercent =
                submission?.grade_percent ??
                calculateAssignmentPercent(
                  submission?.points_awarded,
                  assignment.points_possible,
                );

              return (
                <div
                  key={assignment.id}
                  className={va.panels.secondaryPanel}
                  style={{ borderColor: va.colors.borderColor, padding: "12px" }}
                >
                  <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                    {assignment.title}
                  </div>
                  <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                    Due: {formatDate(assignment.due_at)}
                  </div>
                  <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                    Status: {submission?.status ?? "not_started"}
                  </div>
                  <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                    Grade: {gradePercent == null ? "Not graded" : `${gradePercent}%`}
                  </div>
                  {submission?.feedback && (
                    <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                      Feedback: {submission.feedback}
                    </div>
                  )}
                  {submission?.storage_path && (
                    <button
                      type="button"
                      onClick={() => openSubmissionFile(submission.storage_path)}
                      style={{
                        color: va.colors.primaryColor,
                        textDecoration: "underline",
                        textAlign: "left",
                      }}
                    >
                      Open submitted file
                    </button>
                  )}
                  <div className={`${va.spacing.marginTopMedium} ${va.layout.infoList}`}>
                    <TextInput
                      placeholder="Submission text"
                      value={
                        drafts[assignment.id]?.text_response ??
                        submission?.text_response ??
                        ""
                      }
                      onChange={(event) =>
                        updateDraft(assignment.id, {
                          text_response: event.target.value,
                        })
                      }
                    />
                    <TextInput
                      placeholder="Submission link"
                      value={
                        drafts[assignment.id]?.link_url ??
                        submission?.link_url ??
                        ""
                      }
                      onChange={(event) =>
                        updateDraft(assignment.id, {
                          link_url: event.target.value,
                        })
                      }
                    />
                    <input
                      type="file"
                      onChange={(event) =>
                        updateDraft(assignment.id, {
                          file: event.target.files?.[0] ?? null,
                        })
                      }
                      className={va.forms.inputBase}
                      style={{
                        backgroundColor: va.colors.surfaceColor,
                        borderColor: va.colors.borderColor,
                        color: va.colors.primaryText,
                      }}
                    />
                    <PrimaryButton
                      fullWidth
                      disabled={submittingId === assignment.id}
                      onClick={() => submitAssignment(assignment, submission)}
                    >
                      {submittingId === assignment.id
                        ? "Submitting..."
                        : submission
                          ? "Update Submission"
                          : "Submit Assignment"}
                    </PrimaryButton>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              No assignments have been published yet.
            </div>
          )}
          {message && (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              {message}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
