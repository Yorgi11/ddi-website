import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import TextInput from "../components/TextInput";

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function InstructorDashboard() {
  const { user, profile } = useAuth();
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [gradeDrafts, setGradeDrafts] = useState({});
  const [assignment, setAssignment] = useState({
    title: "",
    description: "",
    instructions: "",
    due_at: "",
    points_possible: "100",
    weight: "1",
  });
  const [post, setPost] = useState({
    title: "",
    body: "",
    media_type: "link",
    media_url: "",
    media_title: "",
    media_file: null,
  });
  const [event, setEvent] = useState({
    title: "",
    description: "",
    starts_at: "",
    ends_at: "",
    meeting_url: "",
  });

  const selectedSection =
    sections.find((section) => section.id === selectedSectionId) ?? null;

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }

  async function sendClassNotification({ type, title, body }) {
    if (!selectedSection) return null;

    const token = await getAccessToken();
    const response = await fetch("/send-class-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        classSectionId: selectedSection.id,
        type,
        title,
        body,
      }),
    });

    return response.json();
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

  async function loadSections() {
    if (!user) return;

    let query = supabase
      .from("class_sections")
      .select(
        `
        *,
        course:courses(slug,title),
        course_level:course_levels(slug,level_number,title)
      `,
      )
      .order("starts_at", { ascending: true });

    if (!profile?.is_admin) {
      query = query.eq("instructor_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      setMessage(error.message);
      return;
    }

    setSections(data ?? []);
    if (!selectedSectionId && data?.[0]?.id) {
      setSelectedSectionId(data[0].id);
    }
  }

  useEffect(() => {
    loadSections();
  }, [user, profile]);

  async function loadGradebook(sectionId = selectedSectionId) {
    if (!sectionId) return;

    const [enrollmentResult, submissionResult] = await Promise.all([
      supabase
        .from("enrollments")
        .select("*, student:profiles(username,email)")
        .eq("class_section_id", sectionId)
        .order("created_at", { ascending: true }),
      supabase
        .from("assignment_submissions")
        .select(
          `
          *,
          assignment:assignments(*),
          enrollment:enrollments(id,status,current_grade,final_grade,completed_at),
          student:profiles(username,email)
        `,
        )
        .order("updated_at", { ascending: false }),
    ]);

    if (enrollmentResult.error || submissionResult.error) {
      setMessage(
        enrollmentResult.error?.message ||
          submissionResult.error?.message ||
          "Unable to load gradebook.",
      );
      return;
    }

    const sectionSubmissions = (submissionResult.data ?? []).filter(
      (submission) => submission.assignment?.class_section_id === sectionId,
    );

    setEnrollments(enrollmentResult.data ?? []);
    setSubmissions(sectionSubmissions);
  }

  useEffect(() => {
    loadGradebook(selectedSectionId);
  }, [selectedSectionId]);

  async function createAssignment() {
    if (!selectedSection) return;
    if (!assignment.title.trim()) {
      setMessage("Assignment title is required.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("assignments").insert({
      class_section_id: selectedSection.id,
      title: assignment.title.trim(),
      description: assignment.description.trim() || null,
      instructions: assignment.instructions.trim() || null,
      due_at: assignment.due_at ? new Date(assignment.due_at).toISOString() : null,
      points_possible: Number(assignment.points_possible || 100),
      weight: Number(assignment.weight || 1),
      submission_type: "mixed",
      is_published: true,
      created_by: user.id,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await sendClassNotification({
      type: "assignment_due",
      title: `New assignment: ${assignment.title.trim()}`,
      body: assignment.due_at
        ? `Due ${formatDate(new Date(assignment.due_at).toISOString())}.`
        : "A new assignment has been posted.",
    });

    setAssignment({
      title: "",
      description: "",
      instructions: "",
      due_at: "",
      points_possible: "100",
      weight: "1",
    });
    setMessage("Assignment published and students were notified.");
  }

  async function createPost() {
    if (!selectedSection) return;
    if (!post.title.trim()) {
      setMessage("Post title is required.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("class_posts")
      .insert({
        class_section_id: selectedSection.id,
        title: post.title.trim(),
        body: post.body.trim() || null,
        is_published: true,
        published_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (!error && (post.media_url.trim() || post.media_file)) {
      let storagePath = null;

      if (post.media_file) {
        const safeName = post.media_file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        storagePath = `${selectedSection.id}/${data.id}/${Date.now()}-${safeName}`;
        const uploadResult = await supabase.storage
          .from("class-post-media")
          .upload(storagePath, post.media_file, {
            upsert: true,
          });

        if (uploadResult.error) {
          setLoading(false);
          setMessage(uploadResult.error.message);
          return;
        }
      }

      const mediaResult = await supabase.from("class_post_media").insert({
        class_post_id: data.id,
        type: post.media_type,
        url: post.media_url.trim() || null,
        storage_path: storagePath,
        title: post.media_title.trim() || post.media_file?.name || null,
      });

      if (mediaResult.error) {
        setLoading(false);
        setMessage(mediaResult.error.message);
        return;
      }
    }

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await sendClassNotification({
      type: "new_post",
      title: `New post: ${post.title.trim()}`,
      body: post.body.trim() || "A new instructor post has been published.",
    });

    setPost({
      title: "",
      body: "",
      media_type: "link",
      media_url: "",
      media_title: "",
      media_file: null,
    });
    setMessage("Post published and students were notified.");
  }

  async function createScheduleEvent() {
    if (!selectedSection) return;
    if (!event.title.trim() || !event.starts_at) {
      setMessage("Schedule event title and start time are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("schedule_events").insert({
      class_section_id: selectedSection.id,
      title: event.title.trim(),
      description: event.description.trim() || null,
      starts_at: new Date(event.starts_at).toISOString(),
      ends_at: event.ends_at ? new Date(event.ends_at).toISOString() : null,
      meeting_url: event.meeting_url.trim() || null,
      created_by: user.id,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await sendClassNotification({
      type: "class_starting",
      title: `Schedule update: ${event.title.trim()}`,
      body: `Starts ${formatDate(new Date(event.starts_at).toISOString())}.`,
    });

    setEvent({
      title: "",
      description: "",
      starts_at: "",
      ends_at: "",
      meeting_url: "",
    });
    setMessage("Schedule event added and students were notified.");
  }

  function updateGradeDraft(submissionId, patch) {
    setGradeDrafts((current) => ({
      ...current,
      [submissionId]: {
        pointsAwarded: current[submissionId]?.pointsAwarded ?? "",
        feedback: current[submissionId]?.feedback ?? "",
        ...patch,
      },
    }));
  }

  async function gradeSubmission(submission) {
    const draft = gradeDrafts[submission.id] ?? {};
    const pointsAwarded =
      draft.pointsAwarded === ""
        ? submission.points_awarded
        : draft.pointsAwarded;

    if (pointsAwarded == null || pointsAwarded === "") {
      setMessage("Points awarded are required before grading.");
      return;
    }

    setLoading(true);
    setMessage("");

    const token = await getAccessToken();
    const response = await fetch("/grade-submission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        submissionId: submission.id,
        pointsAwarded,
        feedback: draft.feedback ?? submission.feedback ?? "",
      }),
    });
    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "Unable to grade submission.");
      return;
    }

    setMessage(
      `Submission graded. Current class grade is ${
        data.currentGrade == null ? "not available" : `${data.currentGrade}%`
      }.`,
    );
    setGradeDrafts((current) => ({
      ...current,
      [submission.id]: {
        pointsAwarded: "",
        feedback: "",
      },
    }));
    loadGradebook();
  }

  async function completeEnrollment(enrollment, override = false) {
    setLoading(true);
    setMessage("");

    const token = await getAccessToken();
    const response = await fetch("/complete-course-level", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        enrollmentId: enrollment.id,
        override,
      }),
    });
    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "Unable to complete enrollment.");
      return;
    }

    setMessage(
      data.certificate
        ? `Level completed and certificate issued: ${data.certificate.certificate_code}`
        : "Level completed and badge awarded.",
    );
    loadGradebook();
  }

  return (
    <PageContainer>
      <div className={va.spacing.pageStack}>
        <SectionCard
          title="Instructor Dashboard"
          description="Manage assigned class sections, assignments, posts, and schedule events."
        >
          <div className={va.layout.infoList}>
            {sections.length > 0 ? (
              sections.map((section) => {
                const active = section.id === selectedSectionId;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setSelectedSectionId(section.id)}
                    className={
                      active ? va.buttons.primaryButton : va.buttons.secondaryButton
                    }
                    style={{
                      backgroundColor: active
                        ? va.colors.primaryColor
                        : va.colors.surfaceColor,
                      borderColor: active
                        ? va.colors.primaryColor
                        : va.colors.borderColor,
                      ...va.textStyles.bodyText(
                        active ? va.colors.secondaryText : va.colors.primaryText,
                      ),
                    }}
                  >
                    {section.title}
                  </button>
                );
              })
            ) : (
              <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                No class sections are assigned to this account yet.
              </div>
            )}
          </div>
        </SectionCard>

        {selectedSection && (
          <>
            <SectionCard
              title={selectedSection.title}
              description={`${selectedSection.course?.title ?? "Course"} / ${
                selectedSection.course_level?.title ?? "Class level"
              }`}
            >
              <div className={va.layout.infoList}>
                <div>Status: {selectedSection.status}</div>
                <div>Delivery: {selectedSection.delivery_mode}</div>
                <div>Starts: {formatDate(selectedSection.starts_at)}</div>
              </div>
            </SectionCard>

            <SectionCard
              title="Publish Assignment"
              description="Create class work for students in this section."
            >
              <div className={va.spacing.sectionStack}>
                <TextInput
                  placeholder="Assignment title"
                  value={assignment.title}
                  onChange={(event) =>
                    setAssignment({ ...assignment, title: event.target.value })
                  }
                />
                <TextInput
                  placeholder="Short description"
                  value={assignment.description}
                  onChange={(event) =>
                    setAssignment({
                      ...assignment,
                      description: event.target.value,
                    })
                  }
                />
                <textarea
                  className={va.forms.inputBase}
                  placeholder="Instructions"
                  value={assignment.instructions}
                  onChange={(event) =>
                    setAssignment({
                      ...assignment,
                      instructions: event.target.value,
                    })
                  }
                  style={{
                    borderColor: va.colors.borderColor,
                    minHeight: "110px",
                  }}
                />
                <div className={va.layout.inputGridTwo}>
                  <TextInput
                    type="datetime-local"
                    value={assignment.due_at}
                    onChange={(event) =>
                      setAssignment({
                        ...assignment,
                        due_at: event.target.value,
                      })
                    }
                    fullWidth={false}
                  />
                  <TextInput
                    placeholder="Points possible"
                    value={assignment.points_possible}
                    onChange={(event) =>
                      setAssignment({
                        ...assignment,
                        points_possible: event.target.value,
                      })
                    }
                    fullWidth={false}
                  />
                </div>
                <PrimaryButton
                  fullWidth
                  disabled={loading}
                  onClick={createAssignment}
                >
                  Publish Assignment
                </PrimaryButton>
              </div>
            </SectionCard>

            <SectionCard
              title="Publish Post"
              description="Share an update, link, image, YouTube video, MP4, or file URL."
            >
              <div className={va.spacing.sectionStack}>
                <TextInput
                  placeholder="Post title"
                  value={post.title}
                  onChange={(event) =>
                    setPost({ ...post, title: event.target.value })
                  }
                />
                <textarea
                  className={va.forms.inputBase}
                  placeholder="Post body"
                  value={post.body}
                  onChange={(event) =>
                    setPost({ ...post, body: event.target.value })
                  }
                  style={{
                    borderColor: va.colors.borderColor,
                    minHeight: "110px",
                  }}
                />
                <div className={va.layout.inputGridTwo}>
                  <select
                    className={va.forms.inputBase}
                    value={post.media_type}
                    onChange={(event) =>
                      setPost({ ...post, media_type: event.target.value })
                    }
                    style={{ borderColor: va.colors.borderColor }}
                  >
                    <option value="link">Link</option>
                    <option value="youtube">YouTube</option>
                    <option value="image">Image</option>
                    <option value="mp4">MP4</option>
                    <option value="file">File</option>
                  </select>
                  <TextInput
                    placeholder="Media title"
                    value={post.media_title}
                    onChange={(event) =>
                      setPost({ ...post, media_title: event.target.value })
                    }
                    fullWidth={false}
                  />
                </div>
                <TextInput
                  placeholder="Media URL"
                  value={post.media_url}
                  onChange={(event) =>
                    setPost({ ...post, media_url: event.target.value })
                  }
                />
                <input
                  type="file"
                  onChange={(event) =>
                    setPost({
                      ...post,
                      media_file: event.target.files?.[0] ?? null,
                    })
                  }
                  className={va.forms.inputBase}
                  style={{
                    backgroundColor: va.colors.surfaceColor,
                    borderColor: va.colors.borderColor,
                    color: va.colors.primaryText,
                  }}
                />
                <PrimaryButton fullWidth disabled={loading} onClick={createPost}>
                  Publish Post
                </PrimaryButton>
              </div>
            </SectionCard>

            <SectionCard
              title="Add Schedule Event"
              description="DDI schedule events are the source of truth for class timing."
            >
              <div className={va.spacing.sectionStack}>
                <TextInput
                  placeholder="Event title"
                  value={event.title}
                  onChange={(inputEvent) =>
                    setEvent({ ...event, title: inputEvent.target.value })
                  }
                />
                <TextInput
                  placeholder="Description"
                  value={event.description}
                  onChange={(inputEvent) =>
                    setEvent({
                      ...event,
                      description: inputEvent.target.value,
                    })
                  }
                />
                <div className={va.layout.inputGridTwo}>
                  <TextInput
                    type="datetime-local"
                    value={event.starts_at}
                    onChange={(inputEvent) =>
                      setEvent({
                        ...event,
                        starts_at: inputEvent.target.value,
                      })
                    }
                    fullWidth={false}
                  />
                  <TextInput
                    type="datetime-local"
                    value={event.ends_at}
                    onChange={(inputEvent) =>
                      setEvent({ ...event, ends_at: inputEvent.target.value })
                    }
                    fullWidth={false}
                  />
                </div>
                <TextInput
                  placeholder="Meeting URL"
                  value={event.meeting_url}
                  onChange={(inputEvent) =>
                    setEvent({ ...event, meeting_url: inputEvent.target.value })
                  }
                />
                <PrimaryButton
                  fullWidth
                  disabled={loading}
                  onClick={createScheduleEvent}
                >
                  Add Schedule Event
                </PrimaryButton>
              </div>
            </SectionCard>

            <SectionCard
              title="Gradebook"
              description="Review submissions, post grades, and complete course levels."
            >
              <div className={va.spacing.sectionStack}>
                <div className={va.layout.infoList}>
                  {submissions.length > 0 ? (
                    submissions.map((submission) => {
                      const draft = gradeDrafts[submission.id] ?? {};
                      return (
                        <div
                          key={submission.id}
                          className={va.panels.secondaryPanel}
                          style={{
                            borderColor: va.colors.borderColor,
                            padding: "12px",
                          }}
                        >
                          <div
                            style={va.textStyles.bodyText(va.colors.primaryText)}
                          >
                            {submission.assignment?.title ?? "Assignment"}
                          </div>
                          <div
                            style={va.textStyles.bodyTextThin(
                              va.colors.primaryTextDark,
                            )}
                          >
                            Student:{" "}
                            {submission.student?.username ||
                              submission.student?.email ||
                              submission.user_id}
                          </div>
                          <div
                            style={va.textStyles.bodyTextThin(
                              va.colors.primaryTextDark,
                            )}
                          >
                            Status: {submission.status}
                          </div>
                          {submission.text_response && (
                            <div
                              style={va.textStyles.bodyTextThin(
                                va.colors.primaryTextDark,
                              )}
                            >
                              Text: {submission.text_response}
                            </div>
                          )}
                          {submission.link_url && (
                            <a
                              href={submission.link_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: va.colors.primaryColor,
                                textDecoration: "underline",
                              }}
                            >
                              Open submission link
                            </a>
                          )}
                          {submission.storage_path && (
                            <button
                              type="button"
                              onClick={() =>
                                openSubmissionFile(submission.storage_path)
                              }
                              style={{
                                color: va.colors.primaryColor,
                                textDecoration: "underline",
                                textAlign: "left",
                              }}
                            >
                              Open submitted file
                            </button>
                          )}
                          <div className={va.spacing.marginTopMedium}>
                            <div className={va.layout.inputGridTwo}>
                              <TextInput
                                placeholder={`Points / ${submission.assignment?.points_possible ?? 100}`}
                                value={
                                  draft.pointsAwarded ??
                                  submission.points_awarded ??
                                  ""
                                }
                                onChange={(event) =>
                                  updateGradeDraft(submission.id, {
                                    pointsAwarded: event.target.value,
                                  })
                                }
                                fullWidth={false}
                              />
                              <TextInput
                                placeholder="Feedback"
                                value={draft.feedback ?? submission.feedback ?? ""}
                                onChange={(event) =>
                                  updateGradeDraft(submission.id, {
                                    feedback: event.target.value,
                                  })
                                }
                                fullWidth={false}
                              />
                            </div>
                            <div className={va.spacing.marginTopMedium}>
                              <PrimaryButton
                                fullWidth
                                disabled={loading}
                                onClick={() => gradeSubmission(submission)}
                              >
                                Post Grade
                              </PrimaryButton>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      style={va.textStyles.bodyTextThin(
                        va.colors.primaryTextDark,
                      )}
                    >
                      No submissions have been received for this section yet.
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Completion Controls"
              description="Complete enrollments when grade requirements are met."
            >
              <div className={va.layout.infoList}>
                {enrollments.length > 0 ? (
                  enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className={va.panels.secondaryPanel}
                      style={{
                        borderColor: va.colors.borderColor,
                        padding: "12px",
                      }}
                    >
                      <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                        {enrollment.student?.username ||
                          enrollment.student?.email ||
                          enrollment.user_id}
                      </div>
                      <div
                        style={va.textStyles.bodyTextThin(
                          va.colors.primaryTextDark,
                        )}
                      >
                        Status: {enrollment.status}
                      </div>
                      <div
                        style={va.textStyles.bodyTextThin(
                          va.colors.primaryTextDark,
                        )}
                      >
                        Grade:{" "}
                        {enrollment.final_grade == null
                          ? "Not calculated"
                          : `${Number(enrollment.final_grade).toFixed(1)}%`}
                      </div>
                      <div className={`${va.layout.inputGridTwo} ${va.spacing.marginTopMedium}`}>
                        <PrimaryButton
                          fullWidth
                          disabled={loading || enrollment.status === "completed"}
                          onClick={() => completeEnrollment(enrollment, false)}
                        >
                          Complete if Eligible
                        </PrimaryButton>
                        <SecondaryButton
                          fullWidth
                          onClick={() => completeEnrollment(enrollment, true)}
                        >
                          Override Complete
                        </SecondaryButton>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}
                  >
                    No students are enrolled in this section yet.
                  </div>
                )}
              </div>
            </SectionCard>
          </>
        )}

        {message && (
          <SectionCard title="Instructor Notice">
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              {message}
            </div>
          </SectionCard>
        )}

        <SecondaryButton fullWidth onClick={loadSections}>
          Refresh Class Sections
        </SecondaryButton>
      </div>
    </PageContainer>
  );
}
