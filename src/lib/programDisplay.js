import { canAccessProgram, getProgramAccessMessage } from "./programAccess";

export function getProgramDisplayState(program, profile, programStatuses = []) {
  const statusRow = programStatuses.find(
    (item) => item.program_id === program.id,
  );
  const status = statusRow?.status ?? "not_started";

  if (status === "completed") {
    return {
      state: "completed",
      message: "Completed",
    };
  }

  if (status === "in_progress") {
    return {
      state: "in_progress",
      message: "Currently in progress",
    };
  }

  if (status === "paid") {
    return {
      state: "paid",
      message: "Paid and ready to begin",
    };
  }

  const hasAccess = canAccessProgram(program.id, profile);

  if (!hasAccess) {
    return {
      state: "locked",
      message: getProgramAccessMessage(program.id, profile),
    };
  }

  return {
    state: "available",
    message: "Available for enrollment",
  };
}
