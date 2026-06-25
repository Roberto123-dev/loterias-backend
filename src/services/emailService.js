const { Resend } = require("resend");
const pool = require("../config/database");

const resend = new Resend(process.env.RESEND_API_KEY);

function gerarHtml(loterias) {
    const baseUrl = process.env.SITE_URL || "https://robertoloterias.com.br";

    const linhas = loterias
        .map(
            (l) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:18px">${l.emoji}</span>
        <strong style="margin-left:8px;color:#1a1a2e">${l.nome}</strong>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#666">
        Concurso ${l.concurso}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:right">
        <span style="background:${l.acumulou ? "#ff6b35" : "#22c55e"};color:white;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:bold">
          ${l.acumulou ? "🔥 ACUMULOU" : "✅ TEVE GANHADOR"}
        </span>
      </td>
    </tr>
  `,
        )
        .join("");

    return `<!DOCTYPE html>
  <html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#6c3fc5,#4f46e5);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
              <div style="font-size:40px;margin-bottom:8px">🍀</div>
              <h1 style="color:white;margin:0;font-size:24px">Roberto Loterias</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px">
                Novos resultados disponíveis hoje!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:white;padding:32px;border-radius:0 0 12px 12px;">
              <p style="color:#444;font-size:15px;margin:0 0 24px">
                Olá! 👋 Os resultados de hoje já estão disponíveis no site. Confira abaixo:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 16px;text-align:left;color:#888;font-size:12px;text-transform:uppercase">Loteria</th>
                    <th style="padding:10px 16px;text-align:left;color:#888;font-size:12px;text-transform:uppercase">Concurso</th>
                    <th style="padding:10px 16px;text-align:right;color:#888;font-size:12px;text-transform:uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>${linhas}</tbody>
              </table>
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${baseUrl}" style="display:inline-block;background:linear-gradient(135deg,#6c3fc5,#4f46e5);color:white;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:bold;">
                  Ver Todos os Resultados →
                </a>
              </div>
              <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
              <p style="color:#999;font-size:12px;text-align:center;margin:0">
                Você recebe este email porque se inscreveu em Roberto Loterias.<br>
                <a href="${baseUrl}/cancelar-notificacao?token=TOKEN_PLACEHOLDER" style="color:#6c3fc5">
                  Cancelar inscrição
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

async function enviarEmailsNovasLoterias(loterias) {
    if (loterias.length === 0) return;

    const { rows } = await pool.query(
        "SELECT email, nome, token_cancelamento FROM email_subscriptions WHERE ativo = TRUE",
    );

    if (rows.length === 0) {
        console.log("[EMAIL] Nenhum inscrito para notificar.");
        return;
    }

    console.log(`[EMAIL] Enviando para ${rows.length} inscrito(s)...`);
    const html = gerarHtml(loterias);

    for (const sub of rows) {
        const htmlPersonalizado = html.replace(
            "TOKEN_PLACEHOLDER",
            sub.token_cancelamento,
        );
        try {
            await resend.emails.send({
                from: `Roberto Loterias <${process.env.EMAIL_FROM}>`,
                to: sub.email,
                subject: "🍀 Novo resultado Lotofácil — Confira agora!",
                html: htmlPersonalizado,
            });
            console.log(`[EMAIL] ✅ Enviado para ${sub.email}`);
        } catch (err) {
            console.error(
                `[EMAIL] ❌ Erro ao enviar para ${sub.email}:`,
                err.message,
            );
        }
        await new Promise((r) => setTimeout(r, 200));
    }

    console.log("[EMAIL] Envios concluídos.");
}

async function sendEmail({ to, subject, html, text }) {
    try {
        await resend.emails.send({
            from: `Roberto Loterias <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html: html || "",
            text: text || "",
        });
        console.log("✅ Email enviado com sucesso para:", to);
    } catch (error) {
        console.error("❌ ERRO AO ENVIAR EMAIL:", error.message);
    }
}

module.exports = { enviarEmailsNovasLoterias, sendEmail };
