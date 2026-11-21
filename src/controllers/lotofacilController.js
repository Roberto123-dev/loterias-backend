// meus-projetos-principais\meu-projeto\backend\src\controllers\lotofacilController.js
const pool = require("../config/database");
const { lerPaginacao } = require("../utils/paginacao");

class LotofacilController {
    async listarTodos(req, res, next) {
        try {
            const { limit, offset } = lerPaginacao(req.query, 20);
            const { rows } = await pool.query(
                "SELECT * FROM lotofacil ORDER BY concurso DESC LIMIT $1 OFFSET $2",
                [limit, offset],
            );
            const { rows: countRows } = await pool.query(
                "SELECT COUNT(*) FROM lotofacil",
            );
            res.json({
                success: true,
                total: parseInt(countRows[0].count),
                data: rows,
            });
        } catch (error) {
            next(error);
        }
    }

    async buscarPorConcurso(req, res, next) {
        try {
            const { concurso } = req.params;
            const { rows } = await pool.query(
                "SELECT * FROM lotofacil WHERE concurso = $1",
                [concurso],
            );
            if (rows.length === 0)
                return res
                    .status(404)
                    .json({
                        success: false,
                        message: "Concurso não encontrado",
                    });
            res.json({ success: true, data: rows[0] });
        } catch (error) {
            next(error);
        }
    }

    async buscarUltimo(req, res, next) {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM lotofacil ORDER BY concurso DESC LIMIT 1",
            );
            if (rows.length === 0)
                return res
                    .status(404)
                    .json({
                        success: false,
                        message: "Nenhum concurso encontrado",
                    });
            res.json({ success: true, data: rows[0] });
        } catch (error) {
            next(error);
        }
    }

    async buscarPorNumero(req, res, next) {
        try {
            const { numero } = req.params;
            // Teto de 500: sem ele, ?limit= devolvia o histórico inteiro
            const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 500);
            const { rows } = await pool.query(
                "SELECT * FROM lotofacil WHERE $1 = ANY(dezenas) ORDER BY concurso DESC LIMIT $2",
                [parseInt(numero), limit],
            );
            res.json({
                success: true,
                numero: parseInt(numero),
                total: rows.length,
                data: rows,
            });
        } catch (error) {
            next(error);
        }
    }

    async estatisticas(req, res, next) {
        try {
            const { rows } = await pool.query(
                "SELECT numero, COUNT(*) as frequencia FROM lotofacil, unnest(dezenas) as numero GROUP BY numero ORDER BY frequencia DESC, numero ASC",
            );
            res.json({ success: true, data: rows });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new LotofacilController();
