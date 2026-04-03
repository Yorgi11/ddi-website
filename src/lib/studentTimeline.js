export function buildStudentTimeline(
  profile,
  payments = [],
  programStatuses = [],
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
    items.push({
      date: payment.created_at,
      title: `Payment ${payment.status === "confirmed" ? "Confirmed" : "Created"}`,
      description: `${payment.program_id} • ${payment.payment_method} • $${Number(payment.total).toFixed(2)}`,
      type: "payment",
    });
  }

  for (const status of programStatuses) {
    let title = "Program Updated";
    let description = `${status.program_id}`;

    if (status.status === "paid") {
      title = "Program Purchased";
      description = `${status.program_id} is paid and ready to begin.`;
    }

    if (status.status === "in_progress") {
      title = "Program Started";
      description = `${status.program_id} is currently in progress.`;
    }

    if (status.status === "completed") {
      title = "Program Completed";
      description = `${status.program_id} has been completed.`;
    }

    items.push({
      date: status.updated_at,
      title,
      description,
      type: "program",
    });
  }

  if ((profile?.completed_levels ?? []).includes("level1")) {
    items.push({
      date: new Date().toISOString(),
      title: "Level 2 Unlocked",
      description: "You now meet the completion path requirement for Level 2.",
      type: "unlock",
    });
  }

  if ((profile?.completed_levels ?? []).includes("level2")) {
    items.push({
      date: new Date().toISOString(),
      title: "Level 3 Unlocked",
      description: "You now meet the completion path requirement for Level 3.",
      type: "unlock",
    });
  }

  return items
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
