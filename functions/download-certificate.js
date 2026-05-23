import { getSupabaseAdmin } from "./_payment-utils.js";

function sanitizePdfText(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ");
}

function wrapText(text, maxLength = 82) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function centerX(text, size, pageWidth = 612) {
  const approximateWidth = String(text ?? "").length * size * 0.48;
  return Math.max(48, Math.round((pageWidth - approximateWidth) / 2));
}

function textLine(text, size, x, y, font = "F1") {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${sanitizePdfText(text)}) Tj ET`;
}

function centeredText(text, size, y, font = "F1") {
  return textLine(text, size, centerX(text, size), y, font);
}

function buildPdf(certificate) {
  const bodyLines = wrapText(certificate.text, 78).slice(0, 6);
  const verifyPath = `/certificates/verify/${certificate.code}`;
  const content = [
    "0.96 0.98 1 rg 0 0 612 792 re f",
    "0.09 0.25 0.43 RG 6 w 36 36 540 720 re S",
    "0.29 0.63 0.78 RG 1.5 w 54 54 504 684 re S",
    "0.09 0.25 0.43 rg 72 690 468 2 re f",
    "0.09 0.25 0.43 rg 72 156 468 2 re f",
    "0 0 0 rg",
    centeredText("Digital Development Institute", 24, 716, "F2"),
    centeredText("Certificate of Completion", 34, 650, "F2"),
    centeredText("This certificate is presented to", 13, 604),
    centeredText(certificate.studentName, 28, 568, "F2"),
    centeredText("for successful completion of", 13, 526),
    centeredText(certificate.courseTitle, 20, 494, "F2"),
    centeredText(certificate.title, 15, 462),
    ...bodyLines.map((text, index) =>
      centeredText(text, 11, 410 - index * 18),
    ),
    textLine("Issued", 10, 72, 126, "F2"),
    textLine(certificate.issuedAt, 11, 72, 108),
    textLine("Certificate Code", 10, 240, 126, "F2"),
    textLine(certificate.code, 11, 240, 108),
    textLine("Verify", 10, 72, 82, "F2"),
    textLine(verifyPath, 10, 112, 82),
    textLine("Authorized by Digital Development Institute", 10, 340, 82),
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

export async function onRequestGet(context) {
  try {
    const supabase = getSupabaseAdmin(context.env);
    const url = new URL(context.request.url);
    const certificateCode = url.searchParams.get("code");

    if (!certificateCode) {
      return new Response("Missing certificate code.", { status: 400 });
    }

    const { data, error } = await supabase
      .from("certificates")
      .select(
        `
        certificate_title,
        certificate_code,
        certificate_text,
        issued_at,
        revoked_at,
        course:courses(title),
        student:profiles(username,email)
      `,
      )
      .eq("certificate_code", certificateCode.trim())
      .maybeSingle();

    if (error) throw error;

    if (!data || data.revoked_at) {
      return new Response("Certificate not found.", { status: 404 });
    }

    const certificate = {
      title: data.certificate_title,
      code: data.certificate_code,
      text: data.certificate_text,
      issuedAt: new Intl.DateTimeFormat("en-CA", {
        dateStyle: "long",
      }).format(new Date(data.issued_at)),
      courseTitle: data.course?.title ?? "Course",
      studentName: data.student?.username || data.student?.email || "Student",
    };
    const pdf = buildPdf(certificate);

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${certificate.code}.pdf"`,
      },
    });
  } catch (error) {
    return new Response(error.message || "Unable to download certificate.", {
      status: 500,
    });
  }
}
