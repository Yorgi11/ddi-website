export function generateReferenceCode(programId, userId) {
  const shortUser = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  const shortProgram = programId.toUpperCase();
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `DDI-${shortProgram}-${shortUser}-${randomPart}`;
}

export function generateConfirmationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
