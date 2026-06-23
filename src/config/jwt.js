// Fonte única do JWT_SECRET — valida na inicialização.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 16) {
    console.error(
        "❌ FATAL: JWT_SECRET não definido (ou muito curto) nas variáveis de ambiente.",
    );
    console.error(
        "   O servidor não vai subir sem um JWT_SECRET seguro. Configure a env var.",
    );
    process.exit(1); // aborta o boot — falha alto
}

module.exports = { JWT_SECRET };
