// Fonte única do CRON_SECRET — valida na inicialização.
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET || CRON_SECRET.length < 32) {
    console.error(
        "❌ FATAL: CRON_SECRET não definido (ou muito curto) nas variáveis de ambiente.",
    );
    console.error(
        "   O servidor não vai subir sem um CRON_SECRET seguro (mín. 32 caracteres).",
    );
    process.exit(1); // aborta o boot — falha alto
}

module.exports = { CRON_SECRET };
