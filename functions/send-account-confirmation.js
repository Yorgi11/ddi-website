import { jsonResponse } from "./_payment-utils.js";

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

function getSender(env) {
  const email = env.BREVO_SENDER_EMAIL;
  const name = env.BREVO_SENDER_NAME || "Digital Development Institute";

  if (!email) {
    throw new Error("Missing BREVO_SENDER_EMAIL.");
  }

  return { email, name };
}

function buildAccountEmail({ username, email, domain }) {
  const safeName = escapeHtml(username || email);
  const loginUrl = `${domain}/account`;

  return {
    subject: "Your Digital Development Institute account was created",
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
          <h1 style="font-size: 22px;">Welcome to Digital Development Institute</h1>
          <p>Hello ${safeName},</p>
          <p>Your DDI account has been created. If email verification is enabled, please also complete the verification email from Supabase before signing in.</p>
          <p>You can return to your account here:</p>
          <p>
            <a href="${loginUrl}" style="background: #2563eb; color: #ffffff; padding: 10px 14px; border-radius: 8px; text-decoration: none;">
              Open Account
            </a>
          </p>
          <p style="color: #475569; font-size: 14px;">If you did not create this account, you can ignore this message.</p>
        </body>
      </html>
    `,
    textContent: `Hello ${username || email},\n\nYour Digital Development Institute account has been created. If email verification is enabled, please also complete the verification email from Supabase before signing in.\n\nOpen your account: ${loginUrl}\n\nIf you did not create this account, you can ignore this message.`,
  };
}

export async function onRequestPost(context) {
  try {
    const { email, username } = await context.request.json();

    if (!context.env.BREVO_API_KEY) {
      return jsonResponse({ error: "Missing BREVO_API_KEY." }, 500);
    }

    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: "A valid email is required." }, 400);
    }

    const domain = (context.env.DOMAIN || context.env.SITE_URL || "").replace(
      /\/$/,
      "",
    );
    const fallbackDomain = new URL(context.request.url).origin;
    const content = buildAccountEmail({
      username,
      email,
      domain: domain || fallbackDomain,
    });

    const response = await fetch(BREVO_EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": context.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: getSender(context.env),
        to: [
          {
            email,
            name: username || email,
          },
        ],
        subject: content.subject,
        htmlContent: content.htmlContent,
        textContent: content.textContent,
        tags: ["account-confirmation"],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return jsonResponse(
        { error: data.message || "Unable to send confirmation email." },
        response.status,
      );
    }

    return jsonResponse({ messageId: data.messageId });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to send confirmation email." },
      500,
    );
  }
}
