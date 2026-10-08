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

// ============================================
// Fase de transição do gerador (etapa 12)
// ============================================
// true enquanto o frontend antigo estiver no ar: o salvamento aceita o formato antigo
// (Lotomania com 100 no lugar de 00 e de 50 a 100 dezenas; Timemania de 7 a 80).
// Depois do deploy do frontend novo, mudar para false (DEPLOY.md, passo 7):
// Lotomania 00–99 com exatamente 50 dezenas; Timemania exatamente 10.
const COMPAT_GERADOR_ANTIGO = true;

// Quantidade de dezenas aceita no salvamento (as demais loterias seguem o limite antigo,
// fora do escopo da etapa 12 — BUGS-LOTERIAS.md, item 8)
const QTD_SALVAMENTO = Object.freeze({
    megasena: { min: 6, max: 60 },
    lotofacil: { min: 15, max: 25 },
    quina: { min: 5, max: 80 },
    lotomania: COMPAT_GERADOR_ANTIGO ? { min: 50, max: 100 } : { min: 50, max: 50 },
    duplasena: { min: 6, max: 50 },
    timemania: COMPAT_GERADOR_ANTIGO ? { min: 7, max: 80 } : { min: 10, max: 10 },
    diadasorte: { min: 7, max: 31 },
    maismilionaria: { min: 6, max: 50 },
});

// ============================================
// Mês da Sorte (Dia de Sorte)
// ============================================
const MESES = Object.freeze([
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]);

const semAcento = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// "3", "03", "Março", "MARCO", "Mar&ccedil;o" → "Março"; inválido → null
function normalizarMes(valor) {
    if (valor === null || valor === undefined) return null;
    let t = String(valor).trim().replace(/&ccedil;/gi, "ç").replace(/&atilde;/gi, "ã");
    if (/^\d{1,2}$/.test(t)) {
        const n = Number(t);
        return n >= 1 && n <= 12 ? MESES[n - 1] : null;
    }
    t = semAcento(t).toLowerCase();
    return MESES.find((m) => semAcento(m).toLowerCase() === t) || null;
}

// "AMERICA      /RN" e "América RN" → "AMERICA RN" (para comparar o time do coração)
function normalizarTime(valor) {
    if (!valor) return "";
    return semAcento(String(valor)).toUpperCase().replace(/\//g, " ").replace(/\s+/g, " ").trim();
}

// ============================================
// Faixas de prêmio OFICIAIS (listaRateioPremio da Caixa, conferidas em 2026-10)
// ============================================
// Dupla Sena: as faixas valem para CADA sorteio (1º: faixas 1–4; 2º: faixas 5–8).
// Timemania e Dia de Sorte: prêmio separado para Time do Coração / Mês da Sorte.
// +Milionária: dezenas + trevos.
function faixaPremio(loteria, acertos, trevos = 0) {
    switch (loteria) {
        case "lotofacil": return acertos >= 11 ? `${acertos} acertos` : null;
        case "megasena": return acertos >= 4 ? `${acertos} acertos` : null;
        case "quina": return acertos >= 2 ? `${acertos} acertos` : null;
        case "lotomania": return acertos >= 15 || acertos === 0 ? `${acertos} acertos` : null;
        case "duplasena": return acertos >= 3 ? `${acertos} acertos` : null;
        case "timemania": return acertos >= 3 ? `${acertos} acertos` : null;
        case "diadasorte": return acertos >= 4 ? `${acertos} acertos` : null;
        case "maismilionaria": {
            if (acertos >= 4) return `${acertos} acertos + ${trevos === 2 ? "2 trevos" : "1 ou nenhum trevo"}`;
            if (acertos === 3 && trevos >= 1) return `3 acertos + ${trevos === 2 ? "2 trevos" : "1 trevo"}`;
            if (acertos === 2 && trevos >= 1) return `2 acertos + ${trevos === 2 ? "2 trevos" : "1 trevo"}`;
            return null;
        }
        default: return null;
    }
}

module.exports = {
    TABELAS_LOTERIA,
    REGRAS_LOTERIA,
    QTD_SALVAMENTO,
    COMPAT_GERADOR_ANTIGO,
    MESES,
    normalizarMes,
    normalizarTime,
    faixaPremio,
    tabelaLoteria,
};
