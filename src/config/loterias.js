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

// Regras usadas para validar entradas da API (mesmos valores de frontend/public/js/loterias.js):
// universo de dezenas (min..max) e máximo de dezenas num jogo.
const REGRAS_LOTERIA = Object.freeze({
    lotofacil: { min: 1, max: 25, apostaMax: 20 },
    megasena: { min: 1, max: 60, apostaMax: 20 },
    quina: { min: 1, max: 80, apostaMax: 15 },
    lotomania: { min: 0, max: 99, apostaMax: 50 },
    duplasena: { min: 1, max: 50, apostaMax: 15 },
    diadasorte: { min: 1, max: 31, apostaMax: 15 },
    timemania: { min: 1, max: 80, apostaMax: 10 },
    maismilionaria: { min: 1, max: 50, apostaMax: 12 },
});

// Retorna o identificador já escapado, ou null se a loteria não é permitida.
function tabelaLoteria(loteria) {
    if (typeof loteria !== "string" || !Object.hasOwn(TABELAS_LOTERIA, loteria)) {
        return null;
    }
    return escapeIdentifier(TABELAS_LOTERIA[loteria]);
}

module.exports = { TABELAS_LOTERIA, REGRAS_LOTERIA, tabelaLoteria };
