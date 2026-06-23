// meus-projetos-principais\meu-projeto\backend\src\controllers\diadasorteController.js
const pool = require("../config/database");

// ==========================================
// LISTAR TODOS OS CONCURSOS
// ==========================================
exports.listarTodos = async (req, res) => {
    try {
        const { limit = 50, offset = 0, concurso } = req.query;

        let query = "SELECT * FROM diadasorte";
        let countQuery = "SELECT COUNT(*) FROM diadasorte";
        const params = [];
        const countParams = [];

        if (concurso) {
            query += " WHERE concurso = $1";
            countQuery += " WHERE concurso = $1";
            params.push(concurso);
            countParams.push(concurso);
        }

        query +=
            " ORDER BY concurso DESC LIMIT $" +
            (params.length + 1) +
            " OFFSET $" +
            (params.length + 2);
        params.push(limit, offset);

        const [result, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, countParams),
        ]);

        res.json({
            success: true,
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    } catch (error) {
        console.error("Erro ao listar Dia de Sorte:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar resultados",
            error: error.message,
        });
    }
};

// ==========================================
// BUSCAR ÚLTIMO CONCURSO
// ==========================================
exports.buscarUltimo = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM diadasorte ORDER BY concurso DESC LIMIT 1",
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Nenhum concurso encontrado",
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Erro ao buscar último concurso:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar último concurso",
            error: error.message,
        });
    }
};

// ==========================================
// BUSCAR POR CONCURSO ESPECÍFICO
// ==========================================
exports.buscarPorConcurso = async (req, res) => {
    try {
        const { concurso } = req.params;

        const result = await pool.query(
            "SELECT * FROM diadasorte WHERE concurso = $1",
            [concurso],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Concurso não encontrado",
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Erro ao buscar concurso:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar concurso",
            error: error.message,
        });
    }
};

// ==========================================
// BUSCAR POR NÚMERO SORTEADO
// ==========================================
exports.buscarPorNumero = async (req, res) => {
    try {
        const { numero } = req.params;
        const { limit = 50 } = req.query;

        const result = await pool.query(
            `SELECT * FROM diadasorte 
       WHERE $1 = ANY(dezenas) 
       ORDER BY concurso DESC 
       LIMIT $2`,
            [numero, limit],
        );

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
        });
    } catch (error) {
        console.error("Erro ao buscar por número:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar por número",
            error: error.message,
        });
    }
};

// ==========================================
// BUSCAR POR MÊS DA SORTE
// ==========================================
exports.buscarPorMes = async (req, res) => {
    try {
        const { mes } = req.params;
        const { limit = 50 } = req.query;

        const result = await pool.query(
            `SELECT * FROM diadasorte 
       WHERE mes_sorte = $1 
       ORDER BY concurso DESC 
       LIMIT $2`,
            [mes, limit],
        );

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length,
            mes: parseInt(mes),
        });
    } catch (error) {
        console.error("Erro ao buscar por mês:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar por mês",
            error: error.message,
        });
    }
};

// ==========================================
// ESTATÍSTICAS
// ==========================================
exports.estatisticas = async (req, res) => {
    try {
        // Frequência das dezenas
        const dezenasResult = await pool.query(`
      SELECT 
        numero,
        COUNT(*) as frequencia
      FROM (
        SELECT UNNEST(dezenas) as numero
        FROM diadasorte
      ) as numeros
      GROUP BY numero
      ORDER BY frequencia DESC, numero ASC
    `);

        // Frequência dos meses
        const mesesResult = await pool.query(`
      SELECT 
        mes_sorte as mes,
        COUNT(*) as frequencia
      FROM diadasorte
      WHERE mes_sorte IS NOT NULL
      GROUP BY mes_sorte
      ORDER BY frequencia DESC
    `);

        res.json({
            success: true,
            data: {
                dezenas: dezenasResult.rows,
                meses: mesesResult.rows,
            },
        });
    } catch (error) {
        console.error("Erro ao calcular estatísticas:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao calcular estatísticas",
            error: error.message,
        });
    }
};

// ==========================================
// CRIAR NOVO CONCURSO
// ==========================================
exports.criar = async (req, res) => {
    try {
        const { concurso, dezenas, mes_sorte } = req.body;

        if (!concurso || !dezenas || dezenas.length !== 7) {
            return res.status(400).json({
                success: false,
                message: "Concurso e 7 dezenas são obrigatórios",
            });
        }

        const result = await pool.query(
            "INSERT INTO diadasorte (concurso, dezenas, mes_sorte) VALUES ($1, $2, $3) RETURNING *",
            [concurso, dezenas, mes_sorte],
        );

        res.status(201).json({
            success: true,
            message: "Concurso criado com sucesso",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Erro ao criar concurso:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao criar concurso",
            error: error.message,
        });
    }
};

// ==========================================
// DELETAR CONCURSO
// ==========================================
exports.deletar = async (req, res) => {
    try {
        const { concurso } = req.params;

        const result = await pool.query(
            "DELETE FROM diadasorte WHERE concurso = $1 RETURNING *",
            [concurso],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Concurso não encontrado",
            });
        }

        res.json({
            success: true,
            message: "Concurso deletado com sucesso",
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Erro ao deletar concurso:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao deletar concurso",
            error: error.message,
        });
    }
};
