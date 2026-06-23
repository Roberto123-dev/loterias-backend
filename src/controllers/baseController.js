// meus-projetos-principais\meu-projeto\backend\src\controllers\baseController.js
const pool = require("../config/database");

function criarController(nomeTabela, nomeLoteria, config = {}) {
    const { temSegundoSorteio = false, campoExtra = null } = config;

    return {
        async listarTodos(req, res, next) {
            try {
                const { limit = 20, offset = 0 } = req.query;
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

        async criar(req, res, next) {
            try {
                const {
                    concurso,
                    dezenas,
                    dezenas_1,
                    dezenas_2,
                    mes_sorte,
                    time_coracao,
                } = req.body;

                if (!concurso) {
                    return res.status(400).json({
                        success: false,
                        message: "Concurso é obrigatório",
                    });
                }

                let query, values;

                if (temSegundoSorteio) {
                    // Dupla-Sena
                    if (!dezenas_1 || !dezenas_2) {
                        return res.status(400).json({
                            success: false,
                            message: "dezenas_1 e dezenas_2 são obrigatórios",
                        });
                    }
                    query = `INSERT INTO ${nomeTabela} (concurso, dezenas_1, dezenas_2) VALUES ($1, $2, $3) RETURNING *`;
                    values = [concurso, dezenas_1, dezenas_2];
                } else if (campoExtra === "mes_sorte") {
                    // Dia de Sorte
                    if (!dezenas) {
                        return res.status(400).json({
                            success: false,
                            message: "Dezenas são obrigatórias",
                        });
                    }
                    query = `INSERT INTO ${nomeTabela} (concurso, dezenas, mes_sorte) VALUES ($1, $2, $3) RETURNING *`;
                    values = [concurso, dezenas, mes_sorte || null];
                } else if (campoExtra === "time_coracao") {
                    // Timemania
                    if (!dezenas) {
                        return res.status(400).json({
                            success: false,
                            message: "Dezenas são obrigatórias",
                        });
                    }
                    query = `INSERT INTO ${nomeTabela} (concurso, dezenas, time_coracao) VALUES ($1, $2, $3) RETURNING *`;
                    values = [concurso, dezenas, time_coracao || null];
                } else {
                    // Loteria padrão
                    if (!dezenas) {
                        return res.status(400).json({
                            success: false,
                            message: "Dezenas são obrigatórias",
                        });
                    }
                    query = `INSERT INTO ${nomeTabela} (concurso, dezenas) VALUES ($1, $2) RETURNING *`;
                    values = [concurso, dezenas];
                }

                const { rows } = await pool.query(query, values);
                res.status(201).json({ success: true, data: rows[0] });
            } catch (error) {
                if (error.code === "23505") {
                    return res.status(409).json({
                        success: false,
                        message: "Concurso já existe",
                    });
                }
                next(error);
            }
        },

        async buscarPorNumero(req, res, next) {
            try {
                const { numero } = req.params;
                const { limit = 50 } = req.query;

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

        async deletar(req, res, next) {
            try {
                const { concurso } = req.params;
                const { rows } = await pool.query(
                    `DELETE FROM ${nomeTabela} WHERE concurso = $1 RETURNING *`,
                    [concurso],
                );
                if (rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Concurso não encontrado",
                    });
                }
                res.json({
                    success: true,
                    message: "Concurso deletado",
                    data: rows[0],
                });
            } catch (error) {
                next(error);
            }
        },
    };
}

module.exports = criarController;
