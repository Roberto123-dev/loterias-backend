// meus-projetos-principais\meu-projeto\backend\src\controllers\adminController.js
// ============================================
// ADMIN CONTROLLER
// ============================================

const pool = require("../config/database");

// ============================================
// VERIFICAR SE USUÁRIO É ADMIN
// ============================================
const verificarAdmin = async (req, res, next) => {
    try {
        const usuarioId = req.usuario.id; // Do middleware auth

        const result = await pool.query(
            "SELECT is_admin FROM usuarios WHERE id = $1",
            [usuarioId],
        );

        if (!result.rows[0] || !result.rows[0].is_admin) {
            return res.status(403).json({
                success: false,
                message:
                    "Acesso negado. Apenas administradores podem acessar este recurso.",
            });
        }

        next();
    } catch (error) {
        console.error("Erro ao verificar admin:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao verificar permissões",
        });
    }
};

// ============================================
// OBTER DASHBOARD (ESTATÍSTICAS)
// ============================================
const getDashboard = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM vw_dashboard_admin");

        const dashboard = result.rows[0] || {
            total_free: 0,
            total_pro_ativos: 0,
            total_pro_expirados: 0,
            total_usuarios: 0,
            receita_hoje: 0,
            receita_mes: 0,
            upgrades_hoje: 0,
            upgrades_mes: 0,
            expiram_7_dias: 0,
        };

        res.json({
            success: true,
            data: dashboard,
        });
    } catch (error) {
        console.error("Erro ao buscar dashboard:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar estatísticas",
        });
    }
};

// ============================================
// LISTAR TODOS OS USUÁRIOS
// ============================================
const listarUsuarios = async (req, res) => {
    try {
        const {
            busca = "",
            plano = "",
            status = "",
            limit = 50,
            offset = 0,
        } = req.query;

        let query = "SELECT * FROM vw_usuarios_admin WHERE 1=1";
        const params = [];
        let paramCount = 0;

        // Filtro de busca (nome ou email)
        if (busca) {
            paramCount++;
            query += ` AND (LOWER(nome) LIKE $${paramCount} OR LOWER(email) LIKE $${paramCount})`;
            params.push(`%${busca.toLowerCase()}%`);
        }

        // Filtro de plano
        if (plano) {
            paramCount++;
            query += ` AND plano = $${paramCount}`;
            params.push(plano);
        }

        // Filtro de status
        if (status) {
            if (status === "ativo") {
                query += ` AND plano = 'pro' AND plano_expira_em > NOW()`;
            } else if (status === "expirado") {
                query += ` AND plano = 'pro' AND plano_expira_em <= NOW()`;
            } else if (status === "free") {
                query += ` AND plano = 'free'`;
            }
        }

        // Contagem total
        const countResult = await pool.query(
            query.replace("SELECT * FROM", "SELECT COUNT(*) as total FROM"),
            params,
        );
        const total = parseInt(countResult.rows[0].total);

        // Adicionar paginação
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        // Buscar usuários
        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    } catch (error) {
        console.error("Erro ao listar usuários:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao listar usuários",
        });
    }
};

// ============================================
// OBTER DETALHES DE UM USUÁRIO
// ============================================
const getUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Dados do usuário
        const userResult = await pool.query(
            "SELECT * FROM vw_usuarios_admin WHERE id = $1",
            [id],
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado",
            });
        }

        // Histórico de upgrades
        const historyResult = await pool.query(
            `SELECT 
        id,
        plano_anterior,
        plano_novo,
        dias_adicionados,
        valor_pago,
        metodo_pagamento,
        expira_em,
        ativado_por,
        observacoes,
        created_at
      FROM historico_upgrades 
      WHERE usuario_id = $1 
      ORDER BY created_at DESC`,
            [id],
        );

        res.json({
            success: true,
            data: {
                usuario: userResult.rows[0],
                historico: historyResult.rows,
            },
        });
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar detalhes do usuário",
        });
    }
};

// ============================================
// ATIVAR PLANO PRO
// ============================================
const ativarPro = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            dias = 30,
            valor = 0,
            metodo = "WhatsApp - PIX",
            observacoes = "",
        } = req.body;

        const adminNome = req.usuario.nome;

        const result = await pool.query(
            "SELECT * FROM ativar_plano_pro($1, $2, $3, $4, $5, $6)",
            [id, dias, valor, metodo, adminNome, observacoes],
        );

        const response = result.rows[0];

        if (response.success) {
            res.json({
                success: true,
                message: response.message,
                data: {
                    expira_em: response.expira_em,
                },
            });
        } else {
            res.status(400).json({
                success: false,
                message: response.message,
            });
        }
    } catch (error) {
        console.error("Erro ao ativar PRO:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao ativar plano PRO",
        });
    }
};

// ============================================
// DESATIVAR PLANO PRO
// ============================================
const desativarPro = async (req, res) => {
    try {
        const { id } = req.params;
        const { observacoes = "Desativação via painel admin" } = req.body;

        const adminNome = req.usuario.nome;

        const result = await pool.query(
            "SELECT * FROM desativar_plano_pro($1, $2, $3)",
            [id, adminNome, observacoes],
        );

        const response = result.rows[0];

        if (response.success) {
            res.json({
                success: true,
                message: response.message,
            });
        } else {
            res.status(400).json({
                success: false,
                message: response.message,
            });
        }
    } catch (error) {
        console.error("Erro ao desativar PRO:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao desativar plano PRO",
        });
    }
};

// ============================================
// OBTER HISTÓRICO COMPLETO
// ============================================
const getHistorico = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        // Contagem total
        const countResult = await pool.query(
            "SELECT COUNT(*) as total FROM historico_upgrades",
        );
        const total = parseInt(countResult.rows[0].total);

        // Buscar histórico
        const result = await pool.query(
            `SELECT 
        h.id,
        h.usuario_id,
        u.nome as usuario_nome,
        u.email as usuario_email,
        h.plano_anterior,
        h.plano_novo,
        h.dias_adicionados,
        h.valor_pago,
        h.metodo_pagamento,
        h.expira_em,
        h.ativado_por,
        h.observacoes,
        h.created_at
      FROM historico_upgrades h
      JOIN usuarios u ON h.usuario_id = u.id
      ORDER BY h.created_at DESC
      LIMIT $1 OFFSET $2`,
            [limit, offset],
        );

        res.json({
            success: true,
            data: result.rows,
            total: total,
            limit: parseInt(limit),
            offset: parseInt(offset),
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
// OBTER ALERTAS DE EXPIRAÇÃO
// ============================================
const getAlertas = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
        id,
        nome,
        email,
        plano,
        plano_expira_em,
        EXTRACT(DAY FROM (plano_expira_em - NOW()))::INTEGER as dias_restantes
      FROM usuarios 
      WHERE plano = 'pro' 
        AND plano_expira_em BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      ORDER BY plano_expira_em ASC`,
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("Erro ao buscar alertas:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar alertas de expiração",
        });
    }
};

// ============================================
// RESETAR SENHA DE USUÁRIO (ADMIN)
// ============================================
const bcrypt = require("bcryptjs");
const SALT_ROUNDS = 10;

const resetarSenha = async (req, res) => {
    try {
        const { id } = req.params;
        const { novaSenha } = req.body;

        if (!novaSenha || novaSenha.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Nova senha deve ter no mínimo 6 caracteres",
            });
        }

        // Verificar se usuário existe
        const userCheck = await pool.query(
            "SELECT id FROM usuarios WHERE id = $1",
            [id],
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado",
            });
        }

        const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

        await pool.query("UPDATE usuarios SET senha = $1 WHERE id = $2", [
            senhaHash,
            id,
        ]);

        console.log(
            `🔐 ADMIN ${req.usuario.nome} (ID: ${req.usuario.id}) redefiniu senha do usuário ${id}`,
        );

        res.json({
            success: true,
            message: "Senha redefinida com sucesso pelo administrador",
        });
    } catch (error) {
        console.error("Erro ao resetar senha:", error);
        res.status(500).json({
            success: false,
            message: "Erro ao redefinir senha",
        });
    }
};

// ============================================
// EXPORTAR FUNÇÕES
// ============================================
module.exports = {
    verificarAdmin,
    getDashboard,
    listarUsuarios,
    getUsuario,
    ativarPro,
    desativarPro,
    getHistorico,
    getAlertas,
    resetarSenha,
};
