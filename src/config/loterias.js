const { escapeIdentifier } = require("pg");

// Tabelas de loteria permitidas — protege contra SQL injection por nome de tabela.
// Nome de tabela não pode ser parâmetro ($1); o valor do cliente vira apenas uma CHAVE.
const TABELAS_LOTERIA = Object.freeze({
    lotofacil: "lotofacil",
    megasena: "megasena",
    quina: "quina",
    lotomania: "lotomania",
    duplasena: "duplasena",
    diadasorte: "diadasorte",
    timemania: "timemania",
    maismilionaria: "maismilionaria",
});

// Retorna o identificador já escapado, ou null se a loteria não é permitida.
function tabelaLoteria(loteria) {
    if (typeof loteria !== "string" || !Object.hasOwn(TABELAS_LOTERIA, loteria)) {
        return null;
    }
    return escapeIdentifier(TABELAS_LOTERIA[loteria]);
}

module.exports = { TABELAS_LOTERIA, tabelaLoteria };
