/**
 * Cloudflare Worker: принимает POST от сайта Night Store и шлёт письмо через Resend.
 *
 * Настройка в Cloudflare Dashboard → Workers → создать Worker → вставить этот код.
 * Переменные окружения (Settings → Variables):
 *   RESEND_API_KEY   — API key с https://resend.com/api-keys
 *   MAIL_FROM        — например "Night Store <noreply@ваш-домен.com>" (домен верифицирован в Resend)
 *   WEBHOOK_SECRET   — (опционально) тот же текст, что window.NIGHTSTORE_EMAIL_CODE_SECRET в firebase-config.js
 *
 * В Worker → Triggers → добавьте маршрут или используйте URL *.workers.dev
 * Скопируйте URL в window.NIGHTSTORE_EMAIL_CODE_WEBHOOK в js/firebase-config.js
 */

function corsHeaders(origin) {
  var o = origin || "*";
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
    "Access-Control-Max-Age": "86400",
  };
}

function subjectForPurpose(purpose) {
  var p = String(purpose || "");
  if (p === "login_pass") return "Код входа — Night Store";
  if (p === "verify") return "Подтверждение почты — Night Store";
  if (p === "link_verify") return "Код для привязки аккаунта — Night Store";
  return "Код Night Store";
}

export default {
  async fetch(request, env) {
    var origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Use POST", { status: 405, headers: corsHeaders(origin) });
    }

    if (env.WEBHOOK_SECRET) {
      var sent = request.headers.get("X-Webhook-Secret") || "";
      if (sent !== env.WEBHOOK_SECRET) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders(origin) });
      }
    }

    var body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders(origin) });
    }

    var email = String((body && body.email) || "")
      .trim()
      .toLowerCase();
    var code = String((body && body.code) || "").trim();
    var purpose = String((body && body.purpose) || "").trim();

    if (!email || email.indexOf("@") === -1 || !code) {
      return new Response("Missing email or code", { status: 400, headers: corsHeaders(origin) });
    }

    var from = env.MAIL_FROM || "Night Store <onboarding@resend.dev>";
    var apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response("RESEND_API_KEY not configured", { status: 500, headers: corsHeaders(origin) });
    }

    var text =
      "Ваш код: " +
      code +
      "\n\nОн действует 15 минут. Если вы не запрашивали код, проигнорируйте письмо.\n\nЦель: " +
      purpose;

    var res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from,
        to: [email],
        subject: subjectForPurpose(purpose),
        text: text,
      }),
    });

    if (!res.ok) {
      var errText = await res.text();
      return new Response("Resend error: " + res.status + " " + errText.slice(0, 500), {
        status: 502,
        headers: corsHeaders(origin),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: Object.assign({ "Content-Type": "application/json" }, corsHeaders(origin)),
    });
  },
};
