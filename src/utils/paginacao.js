// Lê ?limit= e ?offset= com teto, para nenhuma rota devolver o histórico inteiro de uma vez.
// Acima do teto o limit é cortado (não dá erro); quem precisa de mais pagina com offset.
const LIMITE_MAXIMO = 500;

function lerPaginacao(query, limitePadrao = 20) {
    const limit = Number.parseInt(query.limit, 10);
    const offset = Number.parseInt(query.offset, 10);

    return {
        limit:
            Number.isInteger(limit) && limit > 0
                ? Math.min(limit, LIMITE_MAXIMO)
                : limitePadrao,
        offset: Number.isInteger(offset) && offset > 0 ? offset : 0,
    };
}

module.exports = { lerPaginacao, LIMITE_MAXIMO };
