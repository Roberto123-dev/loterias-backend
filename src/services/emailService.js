const { Resend } = require("resend");

// Envio de e-mail transacional (hoje só o "esqueci a senha").
// A notificação de resultados por e-mail foi removida (2026-10); a tabela
// email_subscriptions continua no banco, sem uso.
//
// EMAIL_ENABLED=false desliga todos os envios (ex.: ambiente local). Sem a variável → envia (produção).
const EMAIL_ATIVO = process.env.EMAIL_ENABLED !== "false";
const resend = EMAIL_ATIVO ? new Resend(process.env.RESEND_API_KEY) : null;

if (!EMAIL_ATIVO) {
    console.log("[EMAIL] envio desativado (EMAIL_ENABLED=false)");
}

async function sendEmail({ to, subject, html, text }) {
    if (!EMAIL_ATIVO) {
        console.log("[EMAIL] envio desativado (EMAIL_ENABLED=false)");
        return;
    }
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

module.exports = { sendEmail };
