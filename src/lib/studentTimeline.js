export function buildStudentTimeline(
  profile,
  payments = [],
  enrollments = [],
) {
  const items = [];

  if (profile?.created_at) {
    items.push({
      date: profile.created_at,
      title: "Account Created",
      description: "Your student account was created.",
      type: "account",
    });
  }

  for (const payment of payments) {
    const itemId =
      payment.class_section_id ||
      payment.course_level_id ||
      payment.course_id ||
      "Course payment";

    items.push({
      date: payment.created_at,
      title: `Payment ${payment.status === "confirmed" ? "Confirmed" : "Created"}`,
      description: `${itemId} / ${payment.payment_method} / $${Number(payment.total).toFixed(2)}`,
      type: "payment",
    });
  }

  for (const enrollment of enrollments) {
    const courseTitle = enrollment.course?.title ?? "Course";
    const levelTitle = enrollment.level?.title ?? "Class level";
    const sectionTitle = enrollment.section?.title ?? "Class section";
    let title = "Class Enrollment Updated";
    let description = `${courseTitle} / ${levelTitle} / ${sectionTitle}`;
    let date = enrollment.createdAt;

    if (["paid", "enrolled", "in_progress"].includes(enrollment.status)) {
      title = "Class Enrollment Active";
      description = `${courseTitle} is available in your dashboard.`;
    }

    if (enrollment.status === "completed") {
      title = "Class Level Completed";
      description = `${levelTitle} has been completed.`;
      date = enrollment.completedAt || enrollment.createdAt;
    }

    items.push({
      date,
      title,
      description,
      type: "course",
    });
  }

  if ((profile?.completed_levels ?? []).includes("level1")) {
    items.push({
      date: new Date().toISOString(),
      title: "Course Path Level 2 Unlocked",
      description: "You now meet the completion path requirement for Level 2.",
      type: "unlock",
    });
  }

  if ((profile?.completed_levels ?? []).includes("level2")) {
    items.push({
      date: new Date().toISOString(),
      title: "Course Path Level 3 Unlocked",
      description: "You now meet the completion path requirement for Level 3.",
      type: "unlock",
    });
  }

  return items
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
