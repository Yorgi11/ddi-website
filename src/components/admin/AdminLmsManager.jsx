import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { visualAid as va } from "../../config/visualAid";
import SectionCard from "../SectionCard";
import PrimaryButton from "../PrimaryButton";
import SecondaryButton from "../SecondaryButton";
import TextInput from "../TextInput";

const SECTION_STATUSES = [
  "draft",
  "open",
  "closed",
  "in_progress",
  "completed",
  "archived",
];

const DELIVERY_MODES = ["online", "in_person", "hybrid"];
const ENROLLMENT_STATUSES = [
  "pending_payment",
  "paid",
  "enrolled",
  "in_progress",
  "completed",
  "withdrawn",
  "failed",
];

const EMPTY_COURSE_FORM = {
  slug: "",
  title: "",
  summary: "",
  description: "",
  priority: "1",
  certificate_title: "",
  is_active: true,
};

const EMPTY_LEVEL_FORM = {
  course_id: "",
  slug: "",
  level_number: "1",
  title: "",
  summary: "",
  description: "",
  syllabus: "",
  prerequisite_course_level_id: "",
  is_active: true,
};

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toLocalInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminLmsManager() {
  const [courses, setCourses] = useState([]);
  const [courseLevels, setCourseLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE_FORM);
  const [levelForm, setLevelForm] = useState(EMPTY_LEVEL_FORM);
  const [sectionForm, setSectionForm] = useState({
    course_id: "",
    course_level_id: "",
    instructor_id: "",
    title: "",
    delivery_mode: "online",
    location: "",
    meeting_url: "",
    starts_at: "",
    ends_at: "",
    enrollment_opens_at: "",
    enrollment_closes_at: "",
    capacity: "",
    price: "",
    status: "draft",
  });

  const filteredLevels = useMemo(
    () =>
      courseLevels.filter(
        (level) => level.course_id === sectionForm.course_id,
      ),
    [courseLevels, sectionForm.course_id],
  );

  const levelFormPrerequisites = useMemo(
    () =>
      courseLevels.filter(
        (level) =>
          level.course_id === levelForm.course_id && level.id !== editingLevelId,
      ),
    [courseLevels, editingLevelId, levelForm.course_id],
  );

  async function loadLmsData() {
    setMessage("");

    const [
      courseResult,
      levelResult,
      sectionResult,
      instructorResult,
      enrollmentResult,
      certificateResult,
    ] =
      await Promise.all([
        supabase
          .from("courses")
          .select("*")
          .order("priority", { ascending: false })
          .order("title", { ascending: true }),
        supabase
          .from("course_levels")
          .select("*")
          .order("level_number", { ascending: true }),
        supabase
          .from("class_sections")
          .select(
            `
            *,
            course:courses(title,slug),
            course_level:course_levels(title,level_number),
            instructor:profiles(username,email)
          `,
          )
          .order("starts_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("id,username,email,is_admin,is_instructor")
          .or("is_admin.eq.true,is_instructor.eq.true")
          .order("email", { ascending: true }),
        supabase
          .from("enrollments")
          .select(
            `
            *,
            student:profiles(username,email),
            course:courses(title),
            course_level:course_levels(title,level_number),
            class_section:class_sections(title)
          `,
          )
          .order("updated_at", { ascending: false }),
        supabase
          .from("certificates")
          .select("*, student:profiles(username,email), course:courses(title)")
          .order("issued_at", { ascending: false }),
      ]);

    const firstError =
      courseResult.error ||
      levelResult.error ||
      sectionResult.error ||
      instructorResult.error ||
      enrollmentResult.error ||
      certificateResult.error;

    if (firstError) {
      setMessage(firstError.message);
      return;
    }

    setCourses(courseResult.data ?? []);
    setCourseLevels(levelResult.data ?? []);
    setSections(sectionResult.data ?? []);
    setInstructors(instructorResult.data ?? []);
    setEnrollments(enrollmentResult.data ?? []);
    setCertificates(certificateResult.data ?? []);

    if (!sectionForm.course_id && courseResult.data?.[0]?.id) {
      const firstCourseId = courseResult.data[0].id;
      const firstLevel = (levelResult.data ?? []).find(
        (level) => level.course_id === firstCourseId,
      );
      setLevelForm((current) => ({
        ...current,
        course_id: current.course_id || firstCourseId,
      }));
      setSectionForm((current) => ({
        ...current,
        course_id: firstCourseId,
        course_level_id: firstLevel?.id ?? "",
      }));
    }
  }

  useEffect(() => {
    loadLmsData();
  }, []);

  function updateCourseForm(patch) {
    setCourseForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function updateLevelForm(patch) {
    setLevelForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function updateForm(patch) {
    setSectionForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function handleCourseChange(courseId) {
    const firstLevel = courseLevels.find((level) => level.course_id === courseId);
    updateForm({
      course_id: courseId,
      course_level_id: firstLevel?.id ?? "",
    });
  }

  function resetCourseForm() {
    setEditingCourseId(null);
    setCourseForm(EMPTY_COURSE_FORM);
  }

  function editCourse(course) {
    setEditingCourseId(course.id);
    setCourseForm({
      slug: course.slug ?? "",
      title: course.title ?? "",
      summary: course.summary ?? "",
      description: course.description ?? "",
      priority: String(course.priority ?? 1),
      certificate_title: course.certificate_title ?? "",
      is_active: course.is_active !== false,
    });
  }

  function buildCoursePayload() {
    const title = courseForm.title.trim();
    return {
      slug: slugify(courseForm.slug || title),
      title,
      summary: courseForm.summary.trim() || null,
      description: courseForm.description.trim() || null,
      priority: Number(courseForm.priority || 1),
      certificate_title: courseForm.certificate_title.trim() || null,
      is_active: Boolean(courseForm.is_active),
      updated_at: new Date().toISOString(),
    };
  }

  async function saveCourse() {
    const payload = buildCoursePayload();

    if (!payload.title || !payload.slug) {
      setMessage("Course title and slug are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = editingCourseId
      ? await supabase.from("courses").update(payload).eq("id", editingCourseId)
      : await supabase.from("courses").insert(payload);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(editingCourseId ? "Course updated." : "Course created.");
    resetCourseForm();
    loadLmsData();
  }

  async function toggleCourseActive(course) {
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("courses")
      .update({
        is_active: !course.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course.id);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(course.is_active ? "Course archived." : "Course activated.");
    loadLmsData();
  }

  function resetLevelForm() {
    setEditingLevelId(null);
    setLevelForm((current) => ({
      ...EMPTY_LEVEL_FORM,
      course_id: current.course_id || courses[0]?.id || "",
    }));
  }

  function editCourseLevel(level) {
    setEditingLevelId(level.id);
    setLevelForm({
      course_id: level.course_id ?? "",
      slug: level.slug ?? "",
      level_number: String(level.level_number ?? 1),
      title: level.title ?? "",
      summary: level.summary ?? "",
      description: level.description ?? "",
      syllabus: level.syllabus ?? "",
      prerequisite_course_level_id: level.prerequisite_course_level_id ?? "",
      is_active: level.is_active !== false,
    });
  }

  function buildLevelPayload() {
    const title = levelForm.title.trim();
    return {
      course_id: levelForm.course_id,
      slug: slugify(levelForm.slug || title),
      level_number: Number(levelForm.level_number || 1),
      title,
      summary: levelForm.summary.trim() || null,
      description: levelForm.description.trim() || null,
      syllabus: levelForm.syllabus.trim() || null,
      prerequisite_course_level_id:
        levelForm.prerequisite_course_level_id || null,
      is_active: Boolean(levelForm.is_active),
      updated_at: new Date().toISOString(),
    };
  }

  async function saveCourseLevel() {
    const payload = buildLevelPayload();

    if (!payload.course_id || !payload.title || !payload.slug) {
      setMessage("Course level course, title, and slug are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = editingLevelId
      ? await supabase
          .from("course_levels")
          .update(payload)
          .eq("id", editingLevelId)
      : await supabase.from("course_levels").insert(payload);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(editingLevelId ? "Course level updated." : "Course level created.");
    resetLevelForm();
    loadLmsData();
  }

  async function toggleCourseLevelActive(level) {
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("course_levels")
      .update({
        is_active: !level.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", level.id);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(level.is_active ? "Course level archived." : "Course level activated.");
    loadLmsData();
  }

  function resetSectionForm() {
    setEditingSectionId(null);
    setSectionForm((current) => ({
      ...current,
      title: "",
      instructor_id: "",
      delivery_mode: "online",
      location: "",
      meeting_url: "",
      starts_at: "",
      ends_at: "",
      enrollment_opens_at: "",
      enrollment_closes_at: "",
      capacity: "",
      price: "",
      status: "draft",
    }));
  }

  function editClassSection(section) {
    setEditingSectionId(section.id);
    setSectionForm({
      course_id: section.course_id,
      course_level_id: section.course_level_id,
      instructor_id: section.instructor_id ?? "",
      title: section.title ?? "",
      delivery_mode: section.delivery_mode ?? "online",
      location: section.location ?? "",
      meeting_url: section.meeting_url ?? "",
      starts_at: toLocalInputValue(section.starts_at),
      ends_at: toLocalInputValue(section.ends_at),
      enrollment_opens_at: toLocalInputValue(section.enrollment_opens_at),
      enrollment_closes_at: toLocalInputValue(section.enrollment_closes_at),
      capacity: section.capacity ?? "",
      price: (Number(section.price_cents || 0) / 100).toFixed(2),
      status: section.status ?? "draft",
    });
  }

  function buildSectionPayload() {
    return {
      course_id: sectionForm.course_id,
      course_level_id: sectionForm.course_level_id,
      instructor_id: sectionForm.instructor_id || null,
      title: sectionForm.title.trim(),
      delivery_mode: sectionForm.delivery_mode,
      location: sectionForm.location.trim() || null,
      meeting_url: sectionForm.meeting_url.trim() || null,
      starts_at: sectionForm.starts_at
        ? new Date(sectionForm.starts_at).toISOString()
        : null,
      ends_at: sectionForm.ends_at
        ? new Date(sectionForm.ends_at).toISOString()
        : null,
      enrollment_opens_at: sectionForm.enrollment_opens_at
        ? new Date(sectionForm.enrollment_opens_at).toISOString()
        : null,
      enrollment_closes_at: sectionForm.enrollment_closes_at
        ? new Date(sectionForm.enrollment_closes_at).toISOString()
        : null,
      capacity: sectionForm.capacity ? Number(sectionForm.capacity) : null,
      price_cents: Math.round(Number(sectionForm.price || 0) * 100),
      currency: "CAD",
      status: sectionForm.status,
    };
  }

  async function createClassSection() {
    if (!sectionForm.course_id || !sectionForm.course_level_id) {
      setMessage("Choose a course and course level.");
      return;
    }

    if (!sectionForm.title.trim()) {
      setMessage("Class section title is required.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = editingSectionId
      ? await supabase
          .from("class_sections")
          .update(buildSectionPayload())
          .eq("id", editingSectionId)
      : await supabase.from("class_sections").insert(buildSectionPayload());

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(editingSectionId ? "Class section updated." : "Class section created.");
    resetSectionForm();
    loadLmsData();
  }

  async function updateSectionStatus(sectionId, status) {
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("class_sections")
      .update({ status })
      .eq("id", sectionId);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Class section moved to ${status}.`);
    loadLmsData();
  }

  async function updateEnrollmentStatus(enrollmentId, status) {
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("enrollments")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", enrollmentId);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Enrollment moved to ${status}.`);
    loadLmsData();
  }

  async function revokeCertificate(certificateId) {
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("certificates")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", certificateId);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Certificate revoked.");
    loadLmsData();
  }

  return (
    <div className={va.spacing.pageStack}>
      <SectionCard
        title="LMS Courses"
        description={
          editingCourseId
            ? "Editing an existing course track."
            : "Create and manage course tracks that appear in the LMS catalog."
        }
      >
        <div className={va.spacing.sectionStack}>
          <div className={va.layout.inputGridTwo}>
            <TextInput
              placeholder="Course title"
              value={courseForm.title}
              onChange={(event) =>
                updateCourseForm({ title: event.target.value })
              }
              fullWidth={false}
            />
            <TextInput
              placeholder="URL slug"
              value={courseForm.slug}
              onChange={(event) =>
                updateCourseForm({ slug: event.target.value })
              }
              fullWidth={false}
            />
            <TextInput
              placeholder="Priority"
              type="number"
              value={courseForm.priority}
              onChange={(event) =>
                updateCourseForm({ priority: event.target.value })
              }
              fullWidth={false}
            />
            <TextInput
              placeholder="Certificate title"
              value={courseForm.certificate_title}
              onChange={(event) =>
                updateCourseForm({ certificate_title: event.target.value })
              }
              fullWidth={false}
            />
            <div className={va.layout.spanTwo}>
              <TextInput
                placeholder="Catalog summary"
                value={courseForm.summary}
                onChange={(event) =>
                  updateCourseForm({ summary: event.target.value })
                }
              />
            </div>
            <div className={va.layout.spanTwo}>
              <textarea
                className={va.forms.inputBase}
                placeholder="Long description"
                value={courseForm.description}
                onChange={(event) =>
                  updateCourseForm({ description: event.target.value })
                }
                rows={4}
                style={{
                  borderColor: va.colors.borderColor,
                  minHeight: "120px",
                  resize: "vertical",
                }}
              />
            </div>
            <label
              style={{
                ...va.textStyles.bodyTextThin(va.colors.primaryTextDark),
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <input
                type="checkbox"
                checked={courseForm.is_active}
                onChange={(event) =>
                  updateCourseForm({ is_active: event.target.checked })
                }
              />
              Active in catalog
            </label>
          </div>

          <PrimaryButton fullWidth disabled={loading} onClick={saveCourse}>
            {editingCourseId ? "Save Course" : "Create Course"}
          </PrimaryButton>

          {editingCourseId && (
            <SecondaryButton fullWidth onClick={resetCourseForm}>
              Cancel Course Edit
            </SecondaryButton>
          )}

          {message && (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              {message}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Course Catalog"
        description="Active courses are shown to students. Archived courses remain available for historical records."
      >
        <div className={va.layout.infoList}>
          {courses.length > 0 ? (
            courses.map((course) => (
              <div
                key={course.id}
                className={va.panels.secondaryPanel}
                style={{ borderColor: va.colors.borderColor, padding: "12px" }}
              >
                <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                  {course.title}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  /courses/{course.slug} / Priority: {course.priority} /{" "}
                  {course.is_active ? "Active" : "Archived"}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  {course.summary || "No summary set."}
                </div>
                <div className={`${va.layout.inputGridTwo} ${va.spacing.marginTopMedium}`}>
                  <SecondaryButton fullWidth onClick={() => editCourse(course)}>
                    Edit Course
                  </SecondaryButton>
                  <SecondaryButton
                    fullWidth
                    onClick={() => toggleCourseActive(course)}
                  >
                    {course.is_active ? "Archive Course" : "Activate Course"}
                  </SecondaryButton>
                </div>
              </div>
            ))
          ) : (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              No courses have been created yet.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Course Levels"
        description={
          editingLevelId
            ? "Editing an existing course level."
            : "Create and manage the levels inside each course track."
        }
      >
        <div className={va.spacing.sectionStack}>
          <div className={va.layout.inputGridTwo}>
            <select
              className={va.forms.inputBase}
              value={levelForm.course_id}
              onChange={(event) =>
                updateLevelForm({
                  course_id: event.target.value,
                  prerequisite_course_level_id: "",
                })
              }
              style={{ borderColor: va.colors.borderColor }}
            >
              <option value="">Choose course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <select
              className={va.forms.inputBase}
              value={levelForm.prerequisite_course_level_id}
              onChange={(event) =>
                updateLevelForm({
                  prerequisite_course_level_id: event.target.value,
                })
              }
              style={{ borderColor: va.colors.borderColor }}
            >
              <option value="">No prerequisite</option>
              {levelFormPrerequisites.map((level) => (
                <option key={level.id} value={level.id}>
                  Level {level.level_number}: {level.title}
                </option>
              ))}
            </select>

            <TextInput
              placeholder="Level title"
              value={levelForm.title}
              onChange={(event) =>
                updateLevelForm({ title: event.target.value })
              }
              fullWidth={false}
            />
            <TextInput
              placeholder="Level slug"
              value={levelForm.slug}
              onChange={(event) => updateLevelForm({ slug: event.target.value })}
              fullWidth={false}
            />
            <TextInput
              placeholder="Level number"
              type="number"
              value={levelForm.level_number}
              onChange={(event) =>
                updateLevelForm({ level_number: event.target.value })
              }
              fullWidth={false}
            />
            <label
              style={{
                ...va.textStyles.bodyTextThin(va.colors.primaryTextDark),
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <input
                type="checkbox"
                checked={levelForm.is_active}
                onChange={(event) =>
                  updateLevelForm({ is_active: event.target.checked })
                }
              />
              Active level
            </label>
            <div className={va.layout.spanTwo}>
              <TextInput
                placeholder="Level summary"
                value={levelForm.summary}
                onChange={(event) =>
                  updateLevelForm({ summary: event.target.value })
                }
              />
            </div>
            <div className={va.layout.spanTwo}>
              <textarea
                className={va.forms.inputBase}
                placeholder="Level description"
                value={levelForm.description}
                onChange={(event) =>
                  updateLevelForm({ description: event.target.value })
                }
                rows={4}
                style={{
                  borderColor: va.colors.borderColor,
                  minHeight: "120px",
                  resize: "vertical",
                }}
              />
            </div>
            <div className={va.layout.spanTwo}>
              <textarea
                className={va.forms.inputBase}
                placeholder="Syllabus"
                value={levelForm.syllabus}
                onChange={(event) =>
                  updateLevelForm({ syllabus: event.target.value })
                }
                rows={5}
                style={{
                  borderColor: va.colors.borderColor,
                  minHeight: "140px",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          <PrimaryButton fullWidth disabled={loading} onClick={saveCourseLevel}>
            {editingLevelId ? "Save Course Level" : "Create Course Level"}
          </PrimaryButton>

          {editingLevelId && (
            <SecondaryButton fullWidth onClick={resetLevelForm}>
              Cancel Level Edit
            </SecondaryButton>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Existing Course Levels"
        description="These levels are used by class sections, assignments, certificates, and student progress."
      >
        <div className={va.layout.infoList}>
          {courseLevels.length > 0 ? (
            courseLevels.map((level) => {
              const course = courses.find((item) => item.id === level.course_id);
              const prerequisite = courseLevels.find(
                (item) => item.id === level.prerequisite_course_level_id,
              );

              return (
                <div
                  key={level.id}
                  className={va.panels.secondaryPanel}
                  style={{ borderColor: va.colors.borderColor, padding: "12px" }}
                >
                  <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                    Level {level.level_number}: {level.title}
                  </div>
                  <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                    {course?.title ?? "Unknown course"} / {level.slug} /{" "}
                    {level.is_active ? "Active" : "Archived"}
                  </div>
                  <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                    Prerequisite:{" "}
                    {prerequisite
                      ? `Level ${prerequisite.level_number}: ${prerequisite.title}`
                      : "None"}
                  </div>
                  <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                    {level.summary || "No summary set."}
                  </div>
                  <div className={`${va.layout.inputGridTwo} ${va.spacing.marginTopMedium}`}>
                    <SecondaryButton
                      fullWidth
                      onClick={() => editCourseLevel(level)}
                    >
                      Edit Level
                    </SecondaryButton>
                    <SecondaryButton
                      fullWidth
                      onClick={() => toggleCourseLevelActive(level)}
                    >
                      {level.is_active ? "Archive Level" : "Activate Level"}
                    </SecondaryButton>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              No course levels have been created yet.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="LMS Class Sections"
        description={
          editingSectionId
            ? "Editing an existing scheduled class section."
            : "Create and manage scheduled class sections for enrollment."
        }
      >
        <div className={va.spacing.sectionStack}>
          <div className={va.layout.inputGridTwo}>
            <select
              className={va.forms.inputBase}
              value={sectionForm.course_id}
              onChange={(event) => handleCourseChange(event.target.value)}
              style={{ borderColor: va.colors.borderColor }}
            >
              <option value="">Choose course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <select
              className={va.forms.inputBase}
              value={sectionForm.course_level_id}
              onChange={(event) =>
                updateForm({ course_level_id: event.target.value })
              }
              style={{ borderColor: va.colors.borderColor }}
            >
              <option value="">Choose level</option>
              {filteredLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  Level {level.level_number}: {level.title}
                </option>
              ))}
            </select>

            <div className={va.layout.spanTwo}>
              <TextInput
                placeholder="Class section title"
                value={sectionForm.title}
                onChange={(event) => updateForm({ title: event.target.value })}
              />
            </div>

            <select
              className={va.forms.inputBase}
              value={sectionForm.instructor_id}
              onChange={(event) =>
                updateForm({ instructor_id: event.target.value })
              }
              style={{ borderColor: va.colors.borderColor }}
            >
              <option value="">No instructor assigned</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.username || instructor.email}
                </option>
              ))}
            </select>

            <select
              className={va.forms.inputBase}
              value={sectionForm.delivery_mode}
              onChange={(event) =>
                updateForm({ delivery_mode: event.target.value })
              }
              style={{ borderColor: va.colors.borderColor }}
            >
              {DELIVERY_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>

            <TextInput
              placeholder="Location"
              value={sectionForm.location}
              onChange={(event) => updateForm({ location: event.target.value })}
              fullWidth={false}
            />
            <TextInput
              placeholder="Meeting URL"
              value={sectionForm.meeting_url}
              onChange={(event) =>
                updateForm({ meeting_url: event.target.value })
              }
              fullWidth={false}
            />

            <TextInput
              type="datetime-local"
              value={sectionForm.starts_at}
              onChange={(event) => updateForm({ starts_at: event.target.value })}
              fullWidth={false}
            />
            <TextInput
              type="datetime-local"
              value={sectionForm.ends_at}
              onChange={(event) => updateForm({ ends_at: event.target.value })}
              fullWidth={false}
            />

            <TextInput
              type="datetime-local"
              value={sectionForm.enrollment_opens_at}
              onChange={(event) =>
                updateForm({ enrollment_opens_at: event.target.value })
              }
              fullWidth={false}
            />
            <TextInput
              type="datetime-local"
              value={sectionForm.enrollment_closes_at}
              onChange={(event) =>
                updateForm({ enrollment_closes_at: event.target.value })
              }
              fullWidth={false}
            />

            <TextInput
              placeholder="Capacity"
              value={sectionForm.capacity}
              onChange={(event) => updateForm({ capacity: event.target.value })}
              fullWidth={false}
            />
            <TextInput
              placeholder="Price CAD"
              value={sectionForm.price}
              onChange={(event) => updateForm({ price: event.target.value })}
              fullWidth={false}
            />

            <select
              className={va.forms.inputBase}
              value={sectionForm.status}
              onChange={(event) => updateForm({ status: event.target.value })}
              style={{ borderColor: va.colors.borderColor }}
            >
              {SECTION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <PrimaryButton
            fullWidth
            disabled={loading}
            onClick={createClassSection}
          >
            {editingSectionId ? "Save Class Section" : "Create Class Section"}
          </PrimaryButton>

          {editingSectionId && (
            <SecondaryButton fullWidth onClick={resetSectionForm}>
              Cancel Edit
            </SecondaryButton>
          )}

          {message && (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              {message}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Existing Class Sections"
        description="Open sections appear on course pages and can be purchased through class checkout."
      >
        <div className={va.layout.infoList}>
          {sections.length > 0 ? (
            sections.map((section) => (
              <div
                key={section.id}
                className={va.panels.secondaryPanel}
                style={{ borderColor: va.colors.borderColor, padding: "12px" }}
              >
                <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                  {section.title}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  {section.course?.title} / Level{" "}
                  {section.course_level?.level_number}:{" "}
                  {section.course_level?.title}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  Instructor:{" "}
                  {section.instructor?.username ||
                    section.instructor?.email ||
                    "Unassigned"}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  Status: {section.status} / Starts:{" "}
                  {formatDate(section.starts_at)} / Price: $
                  {(Number(section.price_cents || 0) / 100).toFixed(2)}
                </div>
                <div className={`${va.layout.inputGridTwo} ${va.spacing.marginTopMedium}`}>
                  <SecondaryButton
                    fullWidth
                    onClick={() => editClassSection(section)}
                  >
                    Edit Section
                  </SecondaryButton>
                  <PrimaryButton
                    fullWidth
                    disabled={loading}
                    onClick={() => updateSectionStatus(section.id, "open")}
                  >
                    Open Enrollment
                  </PrimaryButton>
                  <SecondaryButton
                    fullWidth
                    onClick={() => updateSectionStatus(section.id, "closed")}
                  >
                    Close Enrollment
                  </SecondaryButton>
                </div>
              </div>
            ))
          ) : (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              No class sections have been created yet.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Enrollments"
        description="Manually review and override LMS enrollment status."
      >
        <div className={va.layout.infoList}>
          {enrollments.length > 0 ? (
            enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className={va.panels.secondaryPanel}
                style={{ borderColor: va.colors.borderColor, padding: "12px" }}
              >
                <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                  {enrollment.student?.username ||
                    enrollment.student?.email ||
                    enrollment.user_id}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  {enrollment.course?.title} / Level{" "}
                  {enrollment.course_level?.level_number}:{" "}
                  {enrollment.course_level?.title}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  Section: {enrollment.class_section?.title ?? "Unknown"} /
                  Status: {enrollment.status}
                </div>
                <div className={`${va.layout.inputGridTwo} ${va.spacing.marginTopMedium}`}>
                  <select
                    className={va.forms.inputBase}
                    value={enrollment.status}
                    onChange={(event) =>
                      updateEnrollmentStatus(enrollment.id, event.target.value)
                    }
                    style={{ borderColor: va.colors.borderColor }}
                  >
                    {ENROLLMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          ) : (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              No LMS enrollments exist yet.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Certificates"
        description="Review issued certificates and revoke invalid records."
      >
        <div className={va.layout.infoList}>
          {certificates.length > 0 ? (
            certificates.map((certificate) => (
              <div
                key={certificate.id}
                className={va.panels.secondaryPanel}
                style={{ borderColor: va.colors.borderColor, padding: "12px" }}
              >
                <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                  {certificate.certificate_title}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  Student:{" "}
                  {certificate.student?.username ||
                    certificate.student?.email ||
                    certificate.user_id}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  Course: {certificate.course?.title ?? "Unknown"} / Code:{" "}
                  {certificate.certificate_code}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  Status: {certificate.revoked_at ? "revoked" : "active"}
                </div>
                <div className={`${va.layout.inputGridTwo} ${va.spacing.marginTopMedium}`}>
                  <a
                    href={`/certificates/verify/${certificate.certificate_code}`}
                    style={{
                      color: va.colors.primaryColor,
                      textDecoration: "underline",
                    }}
                  >
                    Verify
                  </a>
                  {!certificate.revoked_at && (
                    <SecondaryButton
                      fullWidth
                      onClick={() => revokeCertificate(certificate.id)}
                    >
                      Revoke Certificate
                    </SecondaryButton>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              No certificates have been issued yet.
            </div>
          )}
        </div>
      </SectionCard>

      <SecondaryButton fullWidth onClick={loadLmsData}>
        Refresh LMS Data
      </SecondaryButton>
    </div>
  );
}
