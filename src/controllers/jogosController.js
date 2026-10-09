// meus-projetos-principais\meu-projeto\backend\src\controllers\jogosController.js
// ============================================
// JOGOS CONTROLLER
// ============================================

const pool = require("../config/database");
const { tabelaLoteria, REGRAS_LOTERIA, QTD_SALVAMENTO, normalizarMes } = require("../config/loterias");
const { conferirJogo: conferirPelasRegras } = require("../services/conferencia");
const { lerPaginacao, LIMITE_MAXIMO } = require("../utils/paginacao");

// ============================================
// CONFIGURAÇÕES DAS LOTERIAS
// ============================================
const LOTERIAS_CONFIG = {
    megasena: {
        nome: "Mega-Sena",
        dezenas_min: 6,
        dezenas_max: 15,
        faixa_min: 1,
        faixa_max: 60,
        tem_trevo: false,
        tem_mes: false,
        tem_time: false,
    },
    lotofacil: {
        nome: "Lotofácil",
        dezenas_min: 15,
        dezenas_max: 25,
        faixa_min: 1,
        faixa_max: 25,
        tem_trevo: false,
        tem_mes: false,
        tem_time: false,
    },
    quina: {
        nome: "Quina",
        dezenas_min: 5,
        dezenas_max: 15,
        faixa_min: 1,
        faixa_max: 80,
        tem_trevo: false,
        tem_mes: false,
        tem_time: false,
    },
    lotomania: {
        nome: "Lotomania",
        dezenas_min: 50,
        dezenas_max: 50,
        faixa_min: 0,
        faixa_max: 99,
        tem_trevo: false,
        tem_mes: false,
        tem_time: false,
    },
    duplasena: {
        nome: "Dupla-Sena",
        dezenas_min: 6,
        dezenas_max: 15,
        faixa_min: 1,
        faixa_max: 50,
        tem_trevo: false,
        tem_mes: false,
        tem_time: false,
    },
    timemania: {
        nome: "Timemania",
        dezenas_min: 10,
        dezenas_max: 10,
        faixa_min: 1,
        faixa_max: 80,
        tem_trevo: false,
        tem_mes: false,
        tem_time: true,
    },
    diadasorte: {
        nome: "Dia de Sorte",
        dezenas_min: 7,
        dezenas_max: 15,
        faixa_min: 1,
        faixa_max: 31,
        tem_trevo: false,
        tem_mes: true,
        tem_time: false,
    },
    maismilionaria: {
        nome: "+Milionária",
        dezenas_min: 6,
        dezenas_max: 6,
        faixa_min: 1,
        faixa_max: 50,
        trevos_min: 2,
        trevos_max: 2,
        trevo_faixa_min: 1,
        trevo_faixa_max: 6,
        tem_trevo: true,
        tem_mes: false,
        tem_time: false,
    },
};

// ============================================
// SALVAR JOGO
// ============================================
const salvarJogo = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const {
            loteria,
            nomeJogo,
            dezenas,
            dezenas2,
            trevos,
            mesSorte,
            timeCoracao,
            observacoes,
        } = req.body;

        // Validar loteria
        if (typeof loteria !== "string" || !Object.hasOwn(LOTERIAS_CONFIG, loteria)) {
            return res.status(400).json({
                success: false,
                message: "Loteria inválida",
            });
        }

        // Validar dezenas
        if (!dezenas || !Array.isArray(dezenas)) {
            return res.status(400).json({
                success: false,
                message: "Dezenas inválidas",
            });
        }

        const config = LOTERIAS_CONFIG[loteria];

        // Validar quantidade
        if (
            dezenas.length < config.dezenas_min ||
            dezenas.length > config.dezenas_max
        ) {
            return res.status(400).json({
                success: false,
                message: `${config.nome} requer de ${config.dezenas_min} a ${config.dezenas_max} dezenas`,
            });
        }

        // Validar faixa
        const dezenasInvalidas = dezenas.filter(
            (d) => d < config.faixa_min || d > config.faixa_max,
        );
        if (dezenasInvalidas.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Dezenas devem estar entre ${config.faixa_min} e ${config.faixa_max}`,
            });
        }

        // Validar duplicatas
        const uniqueDezenas = [...new Set(dezenas)];
        if (uniqueDezenas.length !== dezenas.length) {
            return res.status(400).json({
                success: false,
                message: "Não pode haver dezenas repetidas",
            });
        }

        // Validar trevos (+Milionária)
        if (config.tem_trevo) {
            if (!trevos || trevos.length !== 2) {
                return res.status(400).json({
                    success: false,
                    message: "+Milionária requer 2 trevos",
                });
            }

            const trevosInvalidos = trevos.filter((t) => t < 1 || t > 6);
            if (trevosInvalidos.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Trevos devem estar entre 1 e 6",
                });
            }
        }

        // Salvar no banco usando a função
        const result = await pool.query(
            "SELECT * FROM salvar_jogo($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [
                usuarioId,
                loteria,
                nomeJogo || `Jogo ${config.nome}`,
                dezenas.sort((a, b) => a - b),
                dezenas2 ? dezenas2.sort((a, b) => a - b) : null,
                trevos ? trevos.sort((a, b) => a - b) : null,
                mesSorte || null,
                timeCoracao || null,
                observacoes || null,
            ],
        );

        const response = result.rows[0];

        if (response.success) {
            res.json({
                success: true,
                message: response.message,
                data: {
                    jogoId: response.jogo_id,
                },
            });
        } else {
            res.status(400).json({
                success: false,
                message: response.message,
            });
        }
    } catch (error) {
        console.error("Erro ao salvar jogo:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao salvar jogo",
        });
    }
};

// ============================================
// LISTAR MEUS JOGOS (COM SUPORTE À DUPLA SENA)
// ============================================
const listarMeusJogos = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { loteria, favorito } = req.query;
        // Teto de 500 por página (utils/paginacao.js); quem tem mais jogos pagina com offset
        const { limit, offset } = lerPaginacao(req.query, 50);

        // ================================
        // FILTROS (os mesmos na lista e na contagem)
        // ================================
        let filtros = "WHERE usuario_id = $1";
        const params = [usuarioId];

        if (loteria) {
            params.push(loteria);
            filtros += ` AND loteria = $${params.length}`;
        }

        if (favorito === "true") {
            filtros += " AND favorito = TRUE";
        }

        // id desempata jogos salvos no mesmo lote (mesmo created_at): a paginação fica estável
        const [result, contagem] = await Promise.all([
            pool.query(
                `SELECT * FROM vw_meus_jogos ${filtros}
                 ORDER BY created_at DESC, id DESC
                 LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                [...params, limit, offset],
            ),
            pool.query(`SELECT count(*) FROM vw_meus_jogos ${filtros}`, params),
        ]);

        // ================================
        // PROCESSAMENTO DOS JOGOS
        // ================================
        // Um item por jogo. Dupla Sena: os dois sorteios ficam no mesmo item — o card de
        // Meus Jogos confere cada sorteio à parte (frontend js/loterias.js → Loterias.conferir);
        // `acertos` é o do melhor sorteio, gravado pela conferência (services/conferencia.js).
        const jogosProcessados = result.rows.map((jogo) => ({
            ...jogo,
            label: jogo.nome_jogo,
            sorteio: null,
            dezenas_sorteadas: jogo.dezenas_sorteadas || [],
        }));

        // ================================
        // RESPOSTA FINAL
        // ================================
        res.json({
            success: true,
            data: jogosProcessados,
            total: Number(contagem.rows[0].count),
            limit,
            offset,
        });
    } catch (error) {
        console.error("Erro ao listar jogos:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao listar jogos",
        });
    }
};

// ============================================
// OBTER JOGO POR ID
// ============================================
const getJogo = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { id } = req.params;

        const result = await pool.query(
            "SELECT * FROM vw_meus_jogos WHERE id = $1 AND usuario_id = $2",
            [id, usuarioId],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Jogo não encontrado",
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Erro ao buscar jogo:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar jogo",
        });
    }
};

// ============================================
// ATUALIZAR JOGO
// ============================================
const atualizarJogo = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { id } = req.params;
        const { nomeJogo, favorito, observacoes } = req.body;

        // Verificar se o jogo pertence ao usuário
        const checkResult = await pool.query(
            "SELECT id FROM jogos_salvos WHERE id = $1 AND usuario_id = $2",
            [id, usuarioId],
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Jogo não encontrado",
            });
        }

        // Atualizar
        const result = await pool.query(
            `UPDATE jogos_salvos 
       SET nome_jogo = COALESCE($1, nome_jogo),
           favorito = COALESCE($2, favorito),
           observacoes = COALESCE($3, observacoes),
           updated_at = NOW()
       WHERE id = $4 AND usuario_id = $5
       RETURNING *`,
            [nomeJogo, favorito, observacoes, id, usuarioId],
        );

        res.json({
            success: true,
            message: "Jogo atualizado com sucesso",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Erro ao atualizar jogo:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao atualizar jogo",
        });
    }
};

// ============================================
// EXCLUIR JOGO
// ============================================
const excluirJogo = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM jogos_salvos WHERE id = $1 AND usuario_id = $2 RETURNING *",
            [id, usuarioId],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Jogo não encontrado",
            });
        }

        res.json({
            success: true,
            message: "Jogo excluído com sucesso",
        });
    } catch (error) {
        console.error("Erro ao excluir jogo:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao excluir jogo",
        });
    }
};

// ============================================
// CONFERIR JOGO
// ============================================
const conferirJogo = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { id } = req.params;
        const { concurso } = req.body;

        // Verificar se o jogo pertence ao usuário
        const checkResult = await pool.query(
            "SELECT id FROM jogos_salvos WHERE id = $1 AND usuario_id = $2",
            [id, usuarioId],
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Jogo não encontrado",
            });
        }

        // Conferir usando a função
        const result = await pool.query("SELECT * FROM conferir_jogo($1, $2)", [
            id,
            concurso,
        ]);

        const response = result.rows[0];

        if (response.success) {
            res.json({
                success: true,
                message: response.message,
                data: {
                    acertos: response.acertos,
                    premiado: response.premiado,
                },
            });
        } else {
            res.status(400).json({
                success: false,
                message: response.message,
            });
        }
    } catch (error) {
        console.error("Erro ao conferir jogo:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao conferir jogo",
        });
    }
};

// ============================================
// OBTER HISTÓRICO DE CONFERÊNCIAS
// ============================================
const getHistoricoConferencias = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { id } = req.params;

        // Verificar se o jogo pertence ao usuário
        const checkResult = await pool.query(
            "SELECT id FROM jogos_salvos WHERE id = $1 AND usuario_id = $2",
            [id, usuarioId],
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Jogo não encontrado",
            });
        }

        const result = await pool.query(
            `SELECT * FROM historico_conferencias 
       WHERE jogo_id = $1 
       ORDER BY conferido_em DESC`,
            [id],
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar histórico",
        });
    }
};

// ============================================
// GERAR JOGO ALEATÓRIO
// ============================================
const gerarJogoAleatorio = async (req, res) => {
    try {
        const { loteria, quantidade } = req.body;

        if (typeof loteria !== "string" || !Object.hasOwn(LOTERIAS_CONFIG, loteria)) {
            return res.status(400).json({
                success: false,
                message: "Loteria inválida",
            });
        }

        const config = LOTERIAS_CONFIG[loteria];
        const qtd = quantidade || config.dezenas_min;

        if (qtd < config.dezenas_min || qtd > config.dezenas_max) {
            return res.status(400).json({
                success: false,
                message: `Quantidade deve estar entre ${config.dezenas_min} e ${config.dezenas_max}`,
            });
        }

        // Gerar dezenas aleatórias
        const todosNumeros = Array.from(
            { length: config.faixa_max - config.faixa_min + 1 },
            (_, i) => i + config.faixa_min,
        );

        const dezenas = [];
        const numerosDisponiveis = [...todosNumeros];

        for (let i = 0; i < qtd; i++) {
            const randomIndex = Math.floor(
                Math.random() * numerosDisponiveis.length,
            );
            dezenas.push(numerosDisponiveis[randomIndex]);
            numerosDisponiveis.splice(randomIndex, 1);
        }

        dezenas.sort((a, b) => a - b);

        const resultado = {
            loteria,
            dezenas,
        };

        // Gerar trevos se for +Milionária
        if (config.tem_trevo) {
            const trevos = [];
            const trevosDisponiveis = [1, 2, 3, 4, 5, 6];

            for (let i = 0; i < 2; i++) {
                const randomIndex = Math.floor(
                    Math.random() * trevosDisponiveis.length,
                );
                trevos.push(trevosDisponiveis[randomIndex]);
                trevosDisponiveis.splice(randomIndex, 1);
            }

            resultado.trevos = trevos.sort((a, b) => a - b);
        }

        // Gerar mês aleatório se for Dia de Sorte
        if (config.tem_mes) {
            const meses = [
                "Janeiro",
                "Fevereiro",
                "Março",
                "Abril",
                "Maio",
                "Junho",
                "Julho",
                "Agosto",
                "Setembro",
                "Outubro",
                "Novembro",
                "Dezembro",
            ];
            resultado.mesSorte =
                meses[Math.floor(Math.random() * meses.length)];
        }

        res.json({
            success: true,
            data: resultado,
        });
    } catch (error) {
        console.error("Erro ao gerar jogo:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao gerar jogo",
        });
    }
};

// ============================================
// ENDPOINT: SALVAR JOGOS EM LOTE
// ============================================
// Adicione esta função no jogosController.js

// ============================================
// VERSÃO CORRIGIDA - salvarJogosLote
// ============================================
// SUBSTITUA a função antiga por esta no jogosController.js

const salvarJogosLote = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { loteria, jogos, label } = req.body;

        console.log("📦 Salvamento em lote iniciado");
        console.log("👤 Usuário:", usuarioId);
        console.log("🎰 Loteria:", loteria);
        console.log("🎲 Total de jogos:", jogos ? jogos.length : 0);

        // Validações básicas
        if (!loteria || !jogos || !Array.isArray(jogos)) {
            return res.status(400).json({
                success: false,
                message: "Dados inválidos. Informe loteria e array de jogos.",
            });
        }

        if (jogos.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nenhum jogo para salvar.",
            });
        }

        if (jogos.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Limite máximo de 1000 jogos por vez.",
            });
        }

        // Validar loteria
        const loteriasValidas = [
            "megasena",
            "lotofacil",
            "quina",
            "lotomania",
            "duplasena",
            "timemania",
            "diadasorte",
            "maismilionaria",
        ];

        if (!loteriasValidas.includes(loteria)) {
            return res.status(400).json({
                success: false,
                message: "Loteria inválida.",
            });
        }

        // Quantidade aceita por loteria (config/loterias.js; Lotomania e Timemania
        // ficam no limite antigo enquanto COMPAT_GERADOR_ANTIGO = true)
        const loteriaConfig = QTD_SALVAMENTO[loteria];
        const universo = REGRAS_LOTERIA[loteria]; // { min, max } das dezenas (Lotomania 0–99)

        const jogosValidados = [];

        for (let i = 0; i < jogos.length; i++) {
            // Formato antigo: "01 02 03"; novo: { dezenas: [..], trevos: [..], mes_sorte: "Março" }
            const item = jogos[i];
            const textoOuLista = typeof item === "string" ? item.split(" ") : item && item.dezenas;
            if (!Array.isArray(textoOuLista)) {
                return res.status(400).json({ success: false, message: `Jogo ${i + 1} inválido` });
            }
            let dezenas = textoOuLista
                .map((d) => parseInt(String(d).trim(), 10))
                .filter((n) => !isNaN(n));

            // Lotomania: o gerador antigo numerava 1–100; o "100" é o "00" do volante
            if (loteria === "lotomania") dezenas = dezenas.map((d) => (d === 100 ? 0 : d));

            // quantidade
            if (dezenas.length < loteriaConfig.min || dezenas.length > loteriaConfig.max) {
                return res.status(400).json({
                    success: false,
                    message: `Jogo ${i + 1} inválido: quantidade incorreta`,
                });
            }

            // faixa
            if (dezenas.some((d) => d < universo.min || d > universo.max)) {
                return res.status(400).json({
                    success: false,
                    message: `Jogo ${i + 1} contém dezenas inválidas`,
                });
            }

            // duplicadas (inclui 0 e 100 juntos na Lotomania)
            if (new Set(dezenas).size !== dezenas.length) {
                return res.status(400).json({
                    success: false,
                    message: `Jogo ${i + 1} possui dezenas duplicadas`,
                });
            }

            // extras (opcionais: o gerador antigo não envia)
            let trevos = null;
            let mesSorte = null;
            if (item && typeof item === "object") {
                if (loteria === "maismilionaria" && item.trevos !== undefined && item.trevos !== null) {
                    trevos = Array.isArray(item.trevos) ? item.trevos.map((t) => parseInt(t, 10)) : [];
                    const trevosOk =
                        trevos.length >= 2 &&
                        trevos.length <= 6 &&
                        new Set(trevos).size === trevos.length &&
                        trevos.every((t) => Number.isInteger(t) && t >= 1 && t <= 6);
                    if (!trevosOk) {
                        return res.status(400).json({ success: false, message: `Jogo ${i + 1}: trevos inválidos (2 a 6 trevos de 1 a 6)` });
                    }
                }
                if (loteria === "diadasorte" && item.mes_sorte) {
                    mesSorte = normalizarMes(item.mes_sorte);
                    if (!mesSorte) {
                        return res.status(400).json({ success: false, message: `Jogo ${i + 1}: mês da sorte inválido` });
                    }
                }
            }

            jogosValidados.push({ dezenas, trevos, mesSorte });
        }

        console.log("✅ Todos os jogos validados:", jogosValidados.length);

        // ============================================
        // 🔧 INSERIR JOGOS NO BANCO (FORMATO CORRETO)
        // ============================================
        const valores = [];
        const placeholders = [];

        jogosValidados.forEach((jogo, index) => {
            const offset = index * 6; // 6 colunas
            placeholders.push(
                `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`,
            );

            // Passa o ARRAY diretamente, não a string
            valores.push(
                usuarioId,
                loteria,
                label?.trim() || `Jogo ${LOTERIAS_CONFIG[loteria].nome}`,
                jogo.dezenas,
                jogo.trevos,
                jogo.mesSorte,
            );
        });

        const query = `
      INSERT INTO jogos_salvos (usuario_id, loteria, nome_jogo, dezenas, trevos, mes_sorte)
      VALUES ${placeholders.join(", ")}
      RETURNING id
    `;

        console.log("💾 Executando INSERT no banco...");

        const result = await pool.query(query, valores);

        console.log("✅ Jogos salvos com sucesso:", result.rowCount);

        res.json({
            success: true,
            message: `${result.rowCount} jogos salvos com sucesso!`,
            data: {
                total: result.rowCount,
                ids: result.rows.map((r) => r.id),
            },
        });
    } catch (error) {
        console.error("❌ Erro ao salvar jogos em lote:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao salvar jogos",
        });
    }
};

// ============================================
// INSTRUÇÕES:
// ============================================
// 1. Abrir: src/controllers/jogosController.js
// 2. Procurar a função: const salvarJogosLote = async
// 3. SUBSTITUIR toda a função por esta versão
// 4. Salvar (Ctrl+S)
// 5. Reiniciar: docker-compose restart app
// 6. ✅ TESTAR NOVAMENTE!

// ============================================
// ENDPOINT SIMPLIFICADO - CONFERIR JOGO
// ============================================
// Cole esta função no jogosController.js (NO FINAL, antes do module.exports)

const conferirJogoSimples = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { id } = req.params;

        // 1. Verificar se o jogo pertence ao usuário
        const jogoResult = await pool.query(
            "SELECT * FROM jogos_salvos WHERE id = $1 AND usuario_id = $2",
            [id, usuarioId],
        );

        if (jogoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Jogo não encontrado",
            });
        }

        const jogo = jogoResult.rows[0];

        // 2. Buscar último concurso da loteria
        const tabela = tabelaLoteria(jogo.loteria);
        if (!tabela) {
            console.error("Loteria inválida no jogo", jogo.id);
            return res.status(400).json({
                success: false,
                message: "Loteria inválida",
            });
        }

        let concursoResult;
        try {
            concursoResult = await pool.query(
                `SELECT * FROM ${tabela} ORDER BY concurso DESC LIMIT 1`,
            );
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: "Nenhum resultado disponível para esta loteria",
            });
        }

        if (concursoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Nenhum resultado disponível para esta loteria",
            });
        }

        const ultimoConcurso = concursoResult.rows[0];

        // 3–4. Acertos e prêmio pelas regras oficiais (Dupla Sena por sorteio etc.)
        const conferencia = conferirPelasRegras(jogo, ultimoConcurso);
        const acertos = conferencia.acertos;
        const premiado = conferencia.premiado;

        // 5. Atualizar jogo no banco
        await pool.query(
            `UPDATE jogos_salvos 
       SET conferido = TRUE,
           acertos = $1,
           concurso_conferido = $2,
           updated_at = NOW()
       WHERE id = $3`,
            [acertos, ultimoConcurso.concurso, id],
        );

        // 6. Registrar no histórico (SEM ON CONFLICT)
        try {
            await pool.query(
                `INSERT INTO historico_conferencias (jogo_id, concurso, acertos, premiado)
         VALUES ($1, $2, $3, $4)`,
                [id, ultimoConcurso.concurso, acertos, premiado],
            );
        } catch (histError) {
            // Se já existe, ignora silenciosamente
            if (histError.code !== "23505") {
                console.error(
                    "Erro ao registrar histórico:",
                    histError.message,
                );
            }
        }

        // 7. Retornar resultado
        res.json({
            success: true,
            message: `Conferido contra concurso ${ultimoConcurso.concurso}`,
            data: {
                acertos: acertos,
                premiado: premiado,
                concurso: ultimoConcurso.concurso,
            },
        });
    } catch (error) {
        console.error("Erro ao conferir jogo:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao conferir jogo",
        });
    }
};

// ============================================
// FUNÇÃO CORRIGIDA: conferirTodosSimples
// ============================================
// SUBSTITUA a função no jogosController.js (linha ~650) por esta:

const conferirTodosSimples = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        console.log("🔍 Iniciando conferência automática...");
        console.log("👤 Usuário:", usuarioId);

        // Buscar todos os jogos do usuário
        const jogosResult = await pool.query(
            "SELECT * FROM jogos_salvos WHERE usuario_id = $1",
            [usuarioId],
        );

        console.log(
            `📦 Total de jogos encontrados: ${jogosResult.rows.length}`,
        );

        let conferidos = 0;
        let premiados = 0;
        let erros = 0;
        const ultimoPorLoteria = new Map();

        for (const jogo of jogosResult.rows) {
            try {
                // Último concurso da loteria (uma consulta por loteria, não por jogo)
                if (!ultimoPorLoteria.has(jogo.loteria)) {
                    const tabela = tabelaLoteria(jogo.loteria);
                    if (!tabela) {
                        console.error("Loteria inválida no jogo", jogo.id);
                        erros++;
                        continue;
                    }
                    const result = await pool.query(
                        `SELECT * FROM ${tabela} ORDER BY concurso DESC LIMIT 1`,
                    );
                    ultimoPorLoteria.set(jogo.loteria, result.rows[0] || null);
                }
                const ultimo = ultimoPorLoteria.get(jogo.loteria);
                if (!ultimo) {
                    console.log(`⚠️ ${jogo.loteria} sem concursos`);
                    erros++;
                    continue;
                }

                // Regras oficiais (services/conferencia.js): Dupla Sena por sorteio,
                // +Milionária com trevos, Time do Coração / Mês da Sorte
                const conferencia = conferirPelasRegras(jogo, ultimo);
                const concurso = conferencia.concurso;
                const acertos = conferencia.acertos;
                const premiado = conferencia.premiado;

                // ============================================
                // 💾 ATUALIZAR JOGO
                // ============================================
                await pool.query(
                    `
          UPDATE jogos_salvos
          SET conferido = TRUE,
              acertos = $1,
              concurso_conferido = $2,
              updated_at = NOW()
          WHERE id = $3
        `,
                    [acertos, concurso, jogo.id],
                );

                // ============================================
                // 🕓 REGISTRAR HISTÓRICO
                // ============================================
                try {
                    await pool.query(
                        `
            INSERT INTO historico_conferencias
              (jogo_id, concurso, acertos, premiado)
            VALUES ($1, $2, $3, $4)
          `,
                        [jogo.id, concurso, acertos, premiado],
                    );
                } catch (histError) {
                    if (histError.code !== "23505") {
                        console.error(
                            `Erro histórico jogo ${jogo.id}:`,
                            histError.message,
                        );
                    }
                }

                conferidos++;
                if (premiado) premiados++;

                console.log(
                    `✅ Jogo ${jogo.id}: ${acertos} acertos (Concurso ${concurso})${
                        premiado ? " 🏆" : ""
                    }`,
                );
            } catch (err) {
                console.error(
                    `❌ Erro ao conferir jogo ${jogo.id}:`,
                    err.message,
                );
                erros++;
            }
        }

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`✅ Conferência concluída!`);
        console.log(`📊 Total: ${jogosResult.rows.length}`);
        console.log(`✓ Conferidos: ${conferidos}`);
        console.log(`🏆 Premiados: ${premiados}`);
        console.log(`❌ Erros: ${erros}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        res.json({
            success: true,
            message: `${conferidos} jogos conferidos com sucesso!`,
            data: {
                total: jogosResult.rows.length,
                conferidos,
                premiados,
                erros,
            },
        });
    } catch (error) {
        console.error("❌ Erro geral ao conferir todos:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao conferir jogos",
        });
    }
};

// ============================================
// EXCLUIR JOGOS EM LOTE
// ============================================
const excluirJogosEmLote = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Nenhum jogo selecionado para exclusão.",
            });
        }

        // Teto por requisição (o frontend manda em lotes de até 500)
        if (ids.length > LIMITE_MAXIMO || !ids.every((id) => Number.isInteger(id) && id > 0)) {
            return res.status(400).json({
                success: false,
                message: `Envie de 1 a ${LIMITE_MAXIMO} jogos por vez.`,
            });
        }

        const result = await pool.query(
            `
      DELETE FROM jogos_salvos
      WHERE id = ANY($1::int[])
        AND usuario_id = $2
      RETURNING id
      `,
            [ids, usuarioId],
        );

        return res.json({
            success: true,
            message: `${result.rowCount} jogo(s) excluído(s) com sucesso.`,
            data: result.rows.map((r) => r.id),
        });
    } catch (error) {
        console.error("❌ Erro ao excluir jogos em lote:", error);
        return res.status(500).json({
            success: false,
            message: "Erro ao excluir jogos.",
        });
    }
};

// ============================================
// ✏️ ATUALIZAR NOME DO JOGO
// ============================================
const atualizarNomeGrupo = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { nome_antigo, nome_novo } = req.body;

    if (!nome_novo || nome_novo.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Nome inválido",
        });
    }

    try {
        const result = await pool.query(
            `
      UPDATE jogos_salvos
      SET nome_jogo = $1, updated_at = NOW()
      WHERE nome_jogo = $2
        AND usuario_id = $3
      `,
            [nome_novo.trim(), nome_antigo, usuarioId],
        );

        return res.json({
            success: true,
            total: result.rowCount,
        });
    } catch (error) {
        console.error("Erro ao atualizar grupo:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno",
        });
    }
};

// ============================================
// 🗑 REMOVER NOME DO GRUPO (CORRETO)
// ============================================
const removerNomeGrupo = async (req, res) => {
    const usuarioId = req.usuario.id;
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({
            success: false,
            message: "Nome do grupo não informado",
        });
    }

    try {
        const result = await pool.query(
            `
      UPDATE jogos_salvos
      SET nome_jogo = NULL,
          updated_at = NOW()
      WHERE nome_jogo = $1
        AND usuario_id = $2
      `,
            [nome, usuarioId],
        );

        return res.json({
            success: true,
            total: result.rowCount,
        });
    } catch (error) {
        console.error("Erro ao remover nome do grupo:", error);
        return res.status(500).json({
            success: false,
            message: "Erro interno",
        });
    }
};

// ============================================
// 📁 GRUPOS (CRUD)
// ============================================

// ✅ LISTAR GRUPOS POR LOTERIA
const listarGrupos = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { loteria } = req.query;

        if (!loteria) {
            return res.status(400).json({
                success: false,
                message: "Informe a loteria",
            });
        }

        const result = await pool.query(
            `
      SELECT nome
      FROM grupos
      WHERE usuario_id = $1 AND loteria = $2
      ORDER BY nome ASC
      `,
            [usuarioId, loteria],
        );

        res.json({
            success: true,
            data: result.rows.map((r) => r.nome),
        });
    } catch (error) {
        console.error("Erro ao listar grupos:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao listar grupos",
        });
    }
};

// ✅ CRIAR GRUPO
const criarGrupo = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { nome, loteria } = req.body;

        if (!loteria) {
            return res
                .status(400)
                .json({ success: false, message: "Loteria inválida" });
        }

        const nomeLimpo = (nome || "").trim();
        if (!nomeLimpo) {
            return res
                .status(400)
                .json({ success: false, message: "Nome inválido" });
        }

        const result = await pool.query(
            `
      INSERT INTO grupos (usuario_id, loteria, nome)
      VALUES ($1, $2, $3)
      ON CONFLICT (usuario_id, loteria, nome)
      DO NOTHING
      RETURNING id, nome
      `,
            [usuarioId, loteria, nomeLimpo],
        );

        if (result.rows.length === 0) {
            return res.status(409).json({
                success: false,
                message: "Já existe um grupo com esse nome nesta loteria",
            });
        }

        return res.json({
            success: true,
            message: "Grupo criado com sucesso",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Erro ao criar grupo:", error);
        return res.status(500).json({
            success: false,
            message: "Erro ao criar grupo",
        });
    }
};

// ✅ RENOMEAR GRUPO (atualiza tabela grupos + jogos_salvos)
const renomearGrupo = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { loteria, nome_antigo, nome_novo } = req.body;

        const antigo = (nome_antigo || "").trim();
        const novo = (nome_novo || "").trim();

        if (!loteria || !antigo || !novo) {
            return res.status(400).json({
                success: false,
                message: "Dados inválidos",
            });
        }

        if (antigo === novo) {
            return res.json({
                success: true,
                message: "Nada para atualizar",
                total: 0,
            });
        }

        // 1) Renomeia na tabela grupos
        const upGrupo = await pool.query(
            `
      UPDATE grupos
      SET nome = $1, updated_at = NOW()
      WHERE usuario_id = $2 AND loteria = $3 AND nome = $4
      RETURNING id
      `,
            [novo, usuarioId, loteria, antigo],
        );

        if (upGrupo.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Grupo não encontrado",
            });
        }

        // 2) Reflete nos jogos salvos (se houver)
        const upJogos = await pool.query(
            `
      UPDATE jogos_salvos
      SET nome_jogo = $1, updated_at = NOW()
      WHERE usuario_id = $2 AND loteria = $3 AND nome_jogo = $4
      `,
            [novo, usuarioId, loteria, antigo],
        );

        return res.json({
            success: true,
            message: "Grupo renomeado",
            data: { jogosAtualizados: upJogos.rowCount },
        });
    } catch (error) {
        console.error("Erro ao renomear grupo:", error);
        return res.status(500).json({
            success: false,
            message: "Erro ao renomear grupo",
        });
    }
};

// ✅ EXCLUIR GRUPO (remove da tabela grupos + limpa nome_jogo dos jogos_salvos)
const excluirGrupo = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { loteria, nome } = req.body;

        const nomeLimpo = (nome || "").trim();
        if (!loteria || !nomeLimpo) {
            return res.status(400).json({
                success: false,
                message: "Dados inválidos",
            });
        }

        // 1) Remove da tabela grupos
        const del = await pool.query(
            `
      DELETE FROM grupos
      WHERE usuario_id = $1 AND loteria = $2 AND nome = $3
      RETURNING id
      `,
            [usuarioId, loteria, nomeLimpo],
        );

        if (del.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Grupo não encontrado",
            });
        }

        // 2) Limpa nos jogos salvos (não apaga jogos!)
        const upJogos = await pool.query(
            `
      UPDATE jogos_salvos
      SET nome_jogo = NULL, updated_at = NOW()
      WHERE usuario_id = $1 AND loteria = $2 AND nome_jogo = $3
      `,
            [usuarioId, loteria, nomeLimpo],
        );

        return res.json({
            success: true,
            message: "Grupo removido",
            data: { jogosAtualizados: upJogos.rowCount },
        });
    } catch (error) {
        console.error("Erro ao excluir grupo:", error);
        return res.status(500).json({
            success: false,
            message: "Erro ao remover grupo",
        });
    }
};

// ============================================
// ATUALIZAR module.exports
// ============================================
// Adicione estas funções ao exports:

module.exports = {
    salvarJogo,
    listarMeusJogos,
    getJogo,
    atualizarJogo,
    excluirJogo,
    excluirJogosEmLote,
    conferirJogo,
    getHistoricoConferencias,
    gerarJogoAleatorio,
    salvarJogosLote,
    conferirJogoSimples,
    conferirTodosSimples,
    atualizarNomeGrupo,
    removerNomeGrupo,
    listarGrupos,
    criarGrupo,
    renomearGrupo,
    excluirGrupo,
};
