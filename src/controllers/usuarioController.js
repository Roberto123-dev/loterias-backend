// meus-projetos-principais\meu-projeto\backend\src\controllers\usuarioController.js
const pool = require("../config/database");

class UsuarioController {
    // GET /usuarios - Listar todos
    async listarTodos(req, res, next) {
        try {
            const { rows } = await pool.query(
                "SELECT * FROM usuarios ORDER BY id DESC",
            );

            res.json({
                success: true,
                total: rows.length,
                data: rows,
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /usuarios/:id - Buscar por ID
    async buscarPorId(req, res, next) {
        try {
            const { id } = req.params;

            const { rows } = await pool.query(
                "SELECT * FROM usuarios WHERE id = $1",
                [id],
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Usuário não encontrado",
                });
            }

            res.json({
                success: true,
                data: rows[0],
            });
        } catch (error) {
            next(error);
        }
    }

    // POST /usuarios - Criar novo
    async criar(req, res, next) {
        try {
            const { nome, email } = req.body;

            // Validação simples
            if (!nome || !email) {
                return res.status(400).json({
                    success: false,
                    message: "Nome e email são obrigatórios",
                });
            }

            // Validação de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: "Email inválido",
                });
            }

            // Verificar se email já existe
            const emailExiste = await pool.query(
                "SELECT id FROM usuarios WHERE email = $1",
                [email],
            );

            if (emailExiste.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Email já cadastrado",
                });
            }

            // Inserir usuário
            const { rows } = await pool.query(
                "INSERT INTO usuarios (nome, email) VALUES ($1, $2) RETURNING *",
                [nome, email],
            );

            res.status(201).json({
                success: true,
                message: "Usuário criado com sucesso",
                data: rows[0],
            });
        } catch (error) {
            next(error);
        }
    }

    // PUT /usuarios/:id - Atualizar
    async atualizar(req, res, next) {
        try {
            const { id } = req.params;
            const { nome, email } = req.body;

            // Validação
            if (!nome && !email) {
                return res.status(400).json({
                    success: false,
                    message: "Informe pelo menos um campo para atualizar",
                });
            }

            // Verificar se usuário existe
            const usuarioExiste = await pool.query(
                "SELECT id FROM usuarios WHERE id = $1",
                [id],
            );

            if (usuarioExiste.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Usuário não encontrado",
                });
            }

            // Se está atualizando email, verificar duplicidade
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({
                        success: false,
                        message: "Email inválido",
                    });
                }

                const emailEmUso = await pool.query(
                    "SELECT id FROM usuarios WHERE email = $1 AND id != $2",
                    [email, id],
                );

                if (emailEmUso.rows.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: "Email já está em uso por outro usuário",
                    });
                }
            }

            // Construir query dinamicamente
            const campos = [];
            const valores = [];
            let contador = 1;

            if (nome) {
                campos.push(`nome = $${contador}`);
                valores.push(nome);
                contador++;
            }

            if (email) {
                campos.push(`email = $${contador}`);
                valores.push(email);
                contador++;
            }

            valores.push(id);

            const { rows } = await pool.query(
                `UPDATE usuarios SET ${campos.join(
                    ", ",
                )} WHERE id = $${contador} RETURNING *`,
                valores,
            );

            res.json({
                success: true,
                message: "Usuário atualizado com sucesso",
                data: rows[0],
            });
        } catch (error) {
            next(error);
        }
    }

    // DELETE /usuarios/:id - Deletar
    async deletar(req, res, next) {
        try {
            const { id } = req.params;

            const { rows } = await pool.query(
                "DELETE FROM usuarios WHERE id = $1 RETURNING *",
                [id],
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Usuário não encontrado",
                });
            }

            res.json({
                success: true,
                message: "Usuário deletado com sucesso",
                data: rows[0],
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UsuarioController();
