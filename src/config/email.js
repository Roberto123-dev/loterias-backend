// meus-projetos-principais\meu-projeto\backend\src\config\email.js
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

// ======================================================
// VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE (LOG SEGURO)
// ======================================================
const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL;
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "Roberto Loterias";

if (!MAILERSEND_API_KEY) {
    console.error("❌ MAILERSEND_API_KEY NÃO configurada");
}

if (!MAIL_FROM_EMAIL) {
    console.error("❌ MAIL_FROM_EMAIL NÃO configurado");
}

console.log("📧 MailerSend ativo:", !!MAILERSEND_API_KEY);
console.log("📧 Remetente:", MAIL_FROM_EMAIL);
console.log("📧 Nome do remetente:", MAIL_FROM_NAME);

// ======================================================
// INICIALIZAÇÃO DO MAILERSEND
// ======================================================
const mailerSend = new MailerSend({
    apiKey: MAILERSEND_API_KEY,
});

const sentFrom = new Sender(MAIL_FROM_EMAIL, MAIL_FROM_NAME);

// ======================================================
// FUNÇÃO PRINCIPAL DE ENVIO DE EMAIL
// ======================================================
async function sendEmail({ to, subject, html, text }) {
    try {
        if (!to || !subject || (!html && !text)) {
            throw new Error("Parâmetros inválidos para envio de email");
        }

        const recipients = [new Recipient(to)];

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setSubject(subject)
            .setHtml(html || "")
            .setText(text || "");

        const response = await mailerSend.email.send(emailParams);

        console.log("✅ Email enviado com sucesso para:", to);
        return response;
    } catch (error) {
        console.error("❌ ERRO AO ENVIAR EMAIL");

        // Erro retornado pela API do MailerSend
        if (error?.response?.body) {
            console.error("📩 MailerSend response:", error.response.body);
        } else {
            console.error("📩 Erro:", error.message);
        }

        // NÃO lançar erro para não quebrar fluxo de auth
        return null;
    }
}

module.exports = {
    sendEmail,
};
