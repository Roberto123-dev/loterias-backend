// meus-projetos-principais\meu-projeto\backend\src\controllers\analiseController.js
const pool = require("../config/database");
const { tabelaLoteria, REGRAS_LOTERIA } = require("../config/loterias");

// Colunas de dezenas e desdobramento por sorteio.
// Dupla Sena: cada sorteio é um evento (1º e 2º viram dois sorteios em sequência) —
// dezenas de sorteios diferentes nunca se misturam.
function colunasDezenas(loteria) {
    return loteria === "duplasena" ? "dezenas_1, dezenas_2" : "dezenas";
}

function sorteiosEmOrdem(loteria, linhas) {
    if (loteria !== "duplasena") {
        return linhas.map((l) => ({ concurso: l.concurso, rotulo: String(l.concurso), dezenas: l.dezenas }));
    }
    return linhas.flatMap((l) => [
        { concurso: l.concurso, rotulo: `${l.concurso} (1º)`, dezenas: l.dezenas_1 || [] },
        { concurso: l.concurso, rotulo: `${l.concurso} (2º)`, dezenas: l.dezenas_2 || [] },
    ]);
}

const unidadeDe = (loteria) => (loteria === "duplasena" ? "sorteios" : "concursos");

// Mesmo limite que a tela de Análise de Combinações já mostra ao usuário
const MAX_COMBINACOES = 100;

// Lista de dezenas inteiras, sem repetição, dentro do universo da loteria e com no máximo `max` itens
function dezenasValidas(lista, regra, max) {
    return (
        Array.isArray(lista) &&
        lista.length >= 1 &&
        lista.length <= max &&
        new Set(lista).size === lista.length &&
        lista.every((d) => Number.isInteger(d) && d >= regra.min && d <= regra.max)
    );
}

// =====================================================
// 🔢 ANÁLISE DE COMBINAÇÕES
// =====================================================
const analisarCombinacoes = async (req, res) => {
    const { loteria, concursos, combinacoes } = req.body;

    // =========================
    // VALIDAÇÕES
    // =========================
    if (!loteria || !Array.isArray(combinacoes) || combinacoes.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Loteria e combinações são obrigatórias",
        });
    }

    // Resolve a tabela pela whitelist — nunca usa o valor do cliente direto
    const tabela = tabelaLoteria(loteria);
    if (!tabela) {
        return res.status(400).json({
            success: false,
            message: "Loteria inválida",
        });
    }

    const regra = REGRAS_LOTERIA[loteria];
    if (
        combinacoes.length > MAX_COMBINACOES ||
        !combinacoes.every((c) => dezenasValidas(c, regra, regra.apostaMax))
    ) {
        return res.status(400).json({
            success: false,
            message: `Envie até ${MAX_COMBINACOES} combinações, cada uma com até ${regra.apostaMax} dezenas entre ${regra.min} e ${regra.max}, sem repetir.`,
        });
    }

    const limite = parseInt(concursos, 10);
    const limitesPermitidos = [10, 20, 30, 50, 100];

    if (!limitesPermitidos.includes(limite)) {
        return res.status(400).json({
            success: false,
            message: "Quantidade de concursos inválida",
        });
    }

    try {
        // =========================
        // BUSCAR ÚLTIMOS CONCURSOS
        // =========================
        const { rows } = await pool.query(
            `
      SELECT concurso, ${colunasDezenas(loteria)}
      FROM ${tabela}
      ORDER BY concurso DESC
      LIMIT $1
      `,
            [limite],
        );

        if (rows.length === 0) {
            return res.json({ success: true, resultados: [] });
        }

        // Ordem cronológica, um item por sorteio (Dupla Sena: 2 por concurso)
        const concursosOrdenados = sorteiosEmOrdem(loteria, rows.reverse());

        // =========================
        // PROCESSAR COMBINAÇÕES
        // =========================
        const resultados = combinacoes.map((comboOriginal) => {
            const combo = comboOriginal.map(Number).sort((a, b) => a - b);

            let ocorrencias = 0;
            let atrasoAtual = 0;
            let maiorAtraso = 0;
            let atrasoTemp = 0;
            let repeticoesConsecutivas = 0;
            let repeticaoTemp = 0;

            concursosOrdenados.forEach((c) => {
                const dezenasSorteadas = c.dezenas.map(Number);

                const saiu = combo.every((n) => dezenasSorteadas.includes(n));

                if (saiu) {
                    ocorrencias++;
                    repeticaoTemp++;
                    repeticoesConsecutivas = Math.max(
                        repeticoesConsecutivas,
                        repeticaoTemp,
                    );

                    maiorAtraso = Math.max(maiorAtraso, atrasoTemp);
                    atrasoTemp = 0;
                } else {
                    atrasoTemp++;
                    repeticaoTemp = 0;
                }
            });

            atrasoAtual = atrasoTemp;

            return {
                dezenas: combo,
                ocorrencias,
                ocorrenciasPercentual: Number(
                    ((ocorrencias / concursosOrdenados.length) * 100).toFixed(
                        2,
                    ),
                ),
                atrasoAtual,
                maiorAtraso,
                repeticoesConsecutivas,
            };
        });

        // =========================
        // ORDENAR (MAIS OCORRENCIAS)
        // =========================
        resultados.sort((a, b) => b.ocorrencias - a.ocorrencias);

        return res.json({
            success: true,
            totalConcursos: concursosOrdenados.length,
            unidade: unidadeDe(loteria),
            totalCombinacoes: combinacoes.length,
            resultados,
        });
    } catch (error) {
        console.error("❌ Erro na análise de combinações:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno ao analisar combinações",
        });
    }
};

const analisarDezenas = async (req, res) => {
    const { loteria, dezenas } = req.body;

    // Validação básica
    if (!loteria || !Array.isArray(dezenas) || dezenas.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Loteria e dezenas são obrigatórias.",
        });
    }

    const tabela = tabelaLoteria(loteria);
    if (!tabela) {
        return res.status(400).json({
            success: false,
            message: "Loteria inválida",
        });
    }

    const regra = REGRAS_LOTERIA[loteria];
    const universo = regra.max - regra.min + 1;
    if (!dezenasValidas(dezenas, regra, universo)) {
        return res.status(400).json({
            success: false,
            message: `Envie de 1 a ${universo} dezenas inteiras entre ${regra.min} e ${regra.max}, sem repetir.`,
        });
    }

    try {
        // Buscar todos os concursos da loteria
        const result = await pool.query(
            `SELECT concurso, ${colunasDezenas(loteria)} FROM ${tabela} ORDER BY concurso ASC`,
        );

        const concursos = sorteiosEmOrdem(loteria, result.rows);

        const estatisticas = dezenas.map((dez) => {
            let qtd = 0;
            let atrasos = [];
            let ultimo = null;
            let atual = 0;
            let atrasoTemp = 0;

            concursos.forEach((concurso) => {
                const nums = concurso.dezenas.map(Number);
                if (nums.includes(Number(dez))) {
                    if (atrasoTemp > 0) atrasos.push(atrasoTemp);
                    atrasoTemp = 0;
                    qtd++;
                    ultimo = concurso.rotulo;
                } else {
                    atrasoTemp++;
                }
            });

            atual = atrasoTemp;
            const media =
                atrasos.length > 0
                    ? (
                          atrasos.reduce((a, b) => a + b, 0) / atrasos.length
                      ).toFixed(2)
                    : 0;
            const max = atrasos.length > 0 ? Math.max(...atrasos) : 0;

            return {
                dezena: dez,
                qtd,
                atual,
                media: Number(media),
                max,
                ultimo: ultimo || "-",
            };
        });

        res.json({ success: true, unidade: unidadeDe(loteria), data: estatisticas });
    } catch (error) {
        console.error("Erro ao analisar dezenas:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno ao analisar dezenas",
        });
    }
};

module.exports = {
    analisarCombinacoes,
    analisarDezenas,
};
