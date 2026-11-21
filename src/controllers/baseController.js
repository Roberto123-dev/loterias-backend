// meus-projetos-principais\meu-projeto\backend\src\controllers\baseController.js
const pool = require("../config/database");
const { lerPaginacao } = require("../utils/paginacao");

function criarController(nomeTabela, nomeLoteria, config = {}) {
    const { temSegundoSorteio = false } = config;

    return {
        async listarTodos(req, res, next) {
            try {
                const { limit, offset } = lerPaginacao(req.query, 20);
                const { rows } = await pool.query(
                    `SELECT * FROM ${nomeTabela} ORDER BY concurso DESC LIMIT $1 OFFSET $2`,
                    [limit, offset],
                );
                const { rows: countRows } = await pool.query(
                    `SELECT COUNT(*) FROM ${nomeTabela}`,
                );
                res.json({
                    success: true,
                    loteria: nomeLoteria,
                    total: parseInt(countRows[0].count),
                    data: rows,
                });
            } catch (error) {
                next(error);
            }
        },

        async buscarPorConcurso(req, res, next) {
            try {
                const { concurso } = req.params;
                const { rows } = await pool.query(
                    `SELECT * FROM ${nomeTabela} WHERE concurso = $1`,
                    [concurso],
                );
                if (rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Concurso não encontrado",
                    });
                }
                res.json({ success: true, data: rows[0] });
            } catch (error) {
                next(error);
            }
        },

        async buscarUltimo(req, res, next) {
            try {
                const { rows } = await pool.query(
                    `SELECT * FROM ${nomeTabela} ORDER BY concurso DESC LIMIT 1`,
                );
                if (rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Nenhum concurso encontrado",
                    });
                }
                res.json({ success: true, data: rows[0] });
            } catch (error) {
                next(error);
            }
        },

        async buscarPorNumero(req, res, next) {
            try {
                const { numero } = req.params;
                // Teto de 500: sem ele, ?limit= devolvia o histórico inteiro
                const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 500);

                let query;
                if (temSegundoSorteio) {
                    query = `SELECT * FROM ${nomeTabela} WHERE $1 = ANY(dezenas_1) OR $1 = ANY(dezenas_2) ORDER BY concurso DESC LIMIT $2`;
                } else {
                    query = `SELECT * FROM ${nomeTabela} WHERE $1 = ANY(dezenas) ORDER BY concurso DESC LIMIT $2`;
                }

                const { rows } = await pool.query(query, [
                    parseInt(numero),
                    limit,
                ]);
                res.json({
                    success: true,
                    numero: parseInt(numero),
                    total: rows.length,
                    data: rows,
                });
            } catch (error) {
                next(error);
            }
        },

        async estatisticas(req, res, next) {
            try {
                let query;
                if (temSegundoSorteio) {
                    query = `
            SELECT numero, COUNT(*) as frequencia
            FROM (
              SELECT unnest(dezenas_1) as numero FROM ${nomeTabela}
              UNION ALL
              SELECT unnest(dezenas_2) as numero FROM ${nomeTabela}
            ) as numeros
            GROUP BY numero
            ORDER BY frequencia DESC, numero ASC
          `;
                } else {
                    query = `
            SELECT numero, COUNT(*) as frequencia
            FROM ${nomeTabela}, unnest(dezenas) as numero
            GROUP BY numero
            ORDER BY frequencia DESC, numero ASC
          `;
                }

                const { rows } = await pool.query(query);
                res.json({ success: true, loteria: nomeLoteria, data: rows });
            } catch (error) {
                next(error);
            }
        },
    };
}

module.exports = criarController;
