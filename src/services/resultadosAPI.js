const axios = require("axios");
const CaixaAPI = require("./caixaAPI");

// Fonte principal de resultados: o resultados-loterias-api (outro projeto no Railway),
// que já coleta na Caixa pelo IP residencial. A Caixa direta fica como reserva.
//
// Variáveis de ambiente (Railway):
//   RESULTADOS_API_URL   — URL pública do serviço, sem barra final. Sem ela, só a Caixa é usada.
//   RESULTADOS_API_TOKEN — opcional. As rotas GET são públicas hoje; o token vai no header
//                          x-api-token como preparação para quando forem protegidas.
//   RESULTADOS_FONTE     — "caixa" desliga a fonte principal sem precisar de deploy.
const RESULTADOS_API_URL = (process.env.RESULTADOS_API_URL || "").replace(/\/+$/, "");
const RESULTADOS_API_TOKEN = process.env.RESULTADOS_API_TOKEN || "";

function resultadosApiAtiva() {
    return Boolean(RESULTADOS_API_URL) && process.env.RESULTADOS_FONTE !== "caixa";
}

// Mesmo formato de saída do CaixaAPI (o resultados-loterias-api devolve os campos
// com os nomes da Caixa), então reaproveita o formatarDados dele.
class ResultadosAPI extends CaixaAPI {
    constructor(loteria) {
        super(loteria);
        this.baseURL = `${RESULTADOS_API_URL}/api/loterias/${loteria}`;

        this.client = axios.create({
            timeout: 10000,
            headers: {
                Accept: "application/json",
                ...(RESULTADOS_API_TOKEN
                    ? { "x-api-token": RESULTADOS_API_TOKEN }
                    : {}),
            },
            validateStatus: (status) => status >= 200 && status < 300,
        });
    }

    async request(url) {
        try {
            const response = await this.client.get(url, {
                signal: AbortSignal.timeout(10000),
            });
            return response.data;
        } catch (error) {
            console.error(
                `❌ ResultadosAPI (${this.loteria}): ${error.message}${error.code ? ` [${error.code}]` : ""}${error.response ? ` | status ${error.response.status}` : ""}`,
            );
            return null;
        }
    }

    // Concurso "aguardando_apuracao" (resultado rápido, sem rateio) conta como
    // ainda não disponível: gravá-lo marcaria acumulou errado e sem premiações.
    formatarDados(dados) {
        if (!dados || dados.status !== "completo") return null;
        return super.formatarDados(dados);
    }

    // Se o último ainda aguarda apuração, o último disponível é o anterior.
    async buscarUltimo() {
        const data = await this.request(`${this.baseURL}/ultimo`);
        if (!data) return null;

        if (data.status === "completo") return this.formatarDados(data);

        console.log(
            `⏳ ResultadosAPI (${this.loteria}): concurso ${data.numero} aguardando apuração, usando o anterior`,
        );
        return data.concursoAnterior
            ? await this.buscarConcurso(data.concursoAnterior)
            : null;
    }
}

module.exports = { ResultadosAPI, resultadosApiAtiva };
