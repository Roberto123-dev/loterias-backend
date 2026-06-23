// meus-projetos-principais\meu-projeto\backend\src\controllers\analiseController.js
const pool = require("../config/database");

// Tabelas de loteria permitidas — protege contra SQL injection por nome de tabela.
// O valor do cliente vira apenas uma CHAVE de busca; só estes nomes podem ir pra query.
const TABELAS_LOTERIA = {
    lotofacil: "lotofacil",
    megasena: "megasena",
    quina: "quina",
    lotomania: "lotomania",
    duplasena: "duplasena",
    diadasorte: "diadasorte",
    timemania: "timemania",
    maismilionaria: "maismilionaria",
};

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
    const tabela = TABELAS_LOTERIA[loteria];
    if (!tabela) {
        return res.status(400).json({
            success: false,
            message: "Loteria inválida",
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
      SELECT concurso, dezenas
      FROM ${tabela}
      ORDER BY concurso DESC
      LIMIT $1
      `,
            [limite],
        );

        if (rows.length === 0) {
            return res.json({ success: true, resultados: [] });
        }

        // Inverter para ordem cronológica
        const concursosOrdenados = rows.reverse();

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

    const tabela = TABELAS_LOTERIA[loteria];
    if (!tabela) {
        return res.status(400).json({
            success: false,
            message: "Loteria inválida",
        });
    }

    try {
        // Buscar todos os concursos da loteria
        const result = await pool.query(
            `SELECT concurso, dezenas FROM ${tabela} ORDER BY concurso ASC`,
        );

        const concursos = result.rows;

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
                    ultimo = concurso.concurso;
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

        res.json({ success: true, data: estatisticas });
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
