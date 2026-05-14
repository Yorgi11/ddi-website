import {
  getBrevoSender,
  getDomain,
  getSupabaseAdmin,
  jsonResponse,
} from "./_payment-utils.js";

const BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildSignupEmail({ username, email, confirmationUrl, domain }) {
  const safeName = escapeHtml(username || email);
  const safeUrl = escapeHtml(confirmationUrl);
  const logoUrl = `${domain}/Logo_logo.png`;

  return {
    subject: "Confirm your Digital Development Institute account",
    htmlContent: `
      <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #cbd5e1;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 28px 12px;text-align:center;">
                    <img src="${logoUrl}" alt="Digital Development Institute" width="96" style="display:block;margin:0 auto 18px;width:96px;height:auto;" />
                    <h1 style="margin:0;font-size:24px;line-height:1.25;color:#0f172a;">Welcome to Digital Development Institute</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 28px 8px;">
                    <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#334155;">Hello ${safeName},</p>
                    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">Thanks for creating your DDI account. Confirm your email address to finish setup and continue to the student portal.</p>
                    <div style="text-align:center;margin:28px 0;">
                      <a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:12px 20px;border-radius:8px;">Confirm Email and Visit Site</a>
                    </div>
                    <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#475569;">If the button does not work, copy and paste this link into your browser:</p>
                    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;word-break:break-all;">
                      <a href="${safeUrl}" style="color:#2563eb;text-decoration:underline;">${safeUrl}</a>
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">If you did not create this account, you can ignore this email.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#64748b;">Digital Development Institute</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
    textContent: `Hello ${username || email},\n\nThanks for creating your Digital Development Institute account. Confirm your email address to finish setup:\n\n${confirmationUrl}\n\nIf you did not create this account, you can ignore this email.`,
  };
}

async function sendBrevoEmail(env, email, username, confirmationUrl, domain) {
  if (!env.BREVO_API_KEY) {
    throw new Error("Missing BREVO_API_KEY.");
  }

  const content = buildSignupEmail({
    username,
    email,
    confirmationUrl,
    domain,
  });

  const response = await fetch(BREVO_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: getBrevoSender(env),
      to: [{ email, name: username || email }],
      subject: content.subject,
      htmlContent: content.htmlContent,
      textContent: content.textContent,
      tags: ["signup-confirmation"],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Brevo could not send the signup email.");
  }

  return data;
}

export async function onRequestPost(context) {
  try {
    const { email, password, username } = await context.request.json();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanUsername = String(username || "").trim();

    if (!isValidEmail(cleanEmail)) {
      return jsonResponse({ error: "A valid email is required." }, 400);
    }

    if (!password || String(password).length < 6) {
      return jsonResponse(
        { error: "Password must be at least 6 characters." },
        400,
      );
    }

    const supabase = getSupabaseAdmin(context.env);
    const domain = getDomain(context.env, context.request);

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
        },
        redirectTo: `${domain}/account`,
      },
    });

    if (error) {
      return jsonResponse(
        {
          error: error.message || "Unable to create signup confirmation link.",
          code: error.code,
          status: error.status,
        },
        error.status || 500,
      );
    }

    const confirmationUrl = data?.properties?.action_link;

    if (!confirmationUrl) {
      return jsonResponse(
        { error: "Supabase did not return a confirmation link." },
        500,
      );
    }

    await sendBrevoEmail(
      context.env,
      cleanEmail,
      cleanUsername,
      confirmationUrl,
      domain,
    );

    return jsonResponse({ status: "confirmation_sent" });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to register account." },
      500,
    );
  }
}
