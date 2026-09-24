// Escapa texto para inserir com segurança em HTML (corpo de e-mail, templates).
const MAPA = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeHtml(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (c) => MAPA[c]);
}

module.exports = { escapeHtml };
