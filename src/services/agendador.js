const cron = require("node-cron");
const { atualizarTodasLoterias } = require("./atualizadorLoterias.js");

let tarefaAgendada = null;
let atualizacaoEmAndamento = false;

async function executarAtualizacaoManual(origem = "manual") {
    if (atualizacaoEmAndamento) {
        console.log(
            `⚠️ [${origem.toUpperCase()}] Já existe uma atualização em andamento.`,
        );
        return { success: false, message: "Atualização já em andamento" };
    }

    atualizacaoEmAndamento = true;

    console.log(`\n⏰ [${origem.toUpperCase()}] Iniciando atualização...`);
    console.log(`   Data/Hora: ${new Date().toLocaleString("pt-BR")}`);

    try {
        await atualizarTodasLoterias();
        console.log(
            `   ✅ [${origem.toUpperCase()}] Atualização concluída com sucesso!\n`,
        );
        return { success: true, message: "Atualização concluída com sucesso" };
    } catch (error) {
        console.error(
            `   ❌ [${origem.toUpperCase()}] Erro na atualização:`,
            error,
        );
        return { success: false, message: "Erro na atualização" };
    } finally {
        atualizacaoEmAndamento = false;
    }
}

function iniciarAgendador() {
    if (tarefaAgendada) {
        console.log("⚠️ Agendador já estava iniciado.");
        return tarefaAgendada;
    }

    console.log("⏰ Agendador de atualizações iniciado!");

    tarefaAgendada = cron.schedule("*/5 * * * *", async () => {
        await executarAtualizacaoManual("agendador");
    });

    console.log("   📅 Próxima execução: a cada 5 minutos");
    return tarefaAgendada;
}

async function executarAoIniciar() {
    return await executarAtualizacaoManual("inicial");
}

module.exports = {
    iniciarAgendador,
    executarAoIniciar,
    executarAtualizacaoManual,
};
