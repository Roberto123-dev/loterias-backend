// Conferência de um jogo salvo contra um concurso (linha da tabela da loteria, SELECT *).
// Regras oficiais em config/loterias.js (faixaPremio).
// Dupla Sena: cada sorteio é um evento — os acertos são contados em cada sorteio,
// nunca juntando dezenas dos dois.
const { faixaPremio, normalizarMes, normalizarTime } = require("../config/loterias");

function sorteiosDoConcurso(loteria, concurso) {
    if (loteria === "duplasena") {
        return [
            { sorteio: 1, dezenas: (concurso.dezenas_1 || []).map(Number) },
            { sorteio: 2, dezenas: (concurso.dezenas_2 || []).map(Number) },
        ];
    }
    return [{ sorteio: null, dezenas: (concurso.dezenas || []).map(Number) }];
}

// → { concurso, acertos (maior entre os sorteios), premiado, porSorteio[], trevosAcertados,
//     acertouTime, acertouMes }
function conferirJogo(jogo, concurso) {
    const loteria = jogo.loteria;
    const dezenasJogo = (jogo.dezenas || []).map(Number);

    const trevosAcertados =
        loteria === "maismilionaria"
            ? (jogo.trevos || []).map(Number).filter((t) => (concurso.trevos || []).map(Number).includes(t)).length
            : 0;

    const porSorteio = sorteiosDoConcurso(loteria, concurso).map((s) => {
        const acertos = dezenasJogo.filter((d) => s.dezenas.includes(d)).length;
        return { sorteio: s.sorteio, acertos, faixa: faixaPremio(loteria, acertos, trevosAcertados) };
    });

    const acertouTime =
        loteria === "timemania" &&
        Boolean(jogo.time_coracao) &&
        normalizarTime(jogo.time_coracao) === normalizarTime(concurso.time_coracao);
    const mesJogo = normalizarMes(jogo.mes_sorte);
    const acertouMes = loteria === "diadasorte" && Boolean(mesJogo) && mesJogo === normalizarMes(concurso.mes_sorte);

    return {
        concurso: concurso.concurso,
        acertos: Math.max(...porSorteio.map((s) => s.acertos)),
        premiado: porSorteio.some((s) => s.faixa) || acertouTime || acertouMes,
        porSorteio,
        trevosAcertados,
        acertouTime,
        acertouMes,
    };
}

module.exports = { sorteiosDoConcurso, conferirJogo };
