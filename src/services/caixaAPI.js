const axios = require("axios");

class CaixaAPI {
    constructor(loteria) {
        this.loteria = loteria;
        this.baseURL = `https://servicebus3.caixa.gov.br/portaldeloterias/api/${loteria}`;

        this.client = axios.create({
            timeout: 15000,
            headers: {
                Accept: "application/json, text/plain, */*",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
                Referer: "https://loterias.caixa.gov.br/",
                Origin: "https://loterias.caixa.gov.br",
                Connection: "keep-alive",
            },
            validateStatus: (status) => status >= 200 && status < 300,
        });
    }

    async request(url) {
        try {
            const response = await this.client.get(url, {
                signal: AbortSignal.timeout(15000),
            });
            return response.data;
        } catch (error) {
            console.error(
                `❌ CaixaAPI (${this.loteria}): ${error.message}${error.code ? ` [${error.code}]` : ""}${error.response ? ` | status ${error.response.status}` : ""}`,
            );
            return null;
        }
    }

    async buscarUltimo() {
        const data = await this.request(this.baseURL);
        return data ? this.formatarDados(data) : null;
    }

    async buscarConcurso(numero) {
        const data = await this.request(`${this.baseURL}/${numero}`);
        return data ? this.formatarDados(data) : null;
    }

    formatarDados(dados) {
        if (!dados) return null;

        const resultado = {
            numero: dados.numero,
            dataApuracao: dados.dataApuracao,
            dataProximoConcurso: dados.dataProximoConcurso,
            valorEstimadoProximoConcurso:
                parseFloat(dados.valorEstimadoProximoConcurso) || 0,
            listaRateioPremio: dados.listaRateioPremio || [],
            listaDezenas: (dados.listaDezenas || []).map(Number),
        };

        if (this.loteria === "duplasena") {
            resultado.listaDezenasSegundoSorteio = (
                dados.listaDezenasSegundoSorteio || []
            ).map(Number);
        }

        if (this.loteria === "timemania" || this.loteria === "diadesorte") {
            resultado.nomeTimeCoracaoMesSorte =
                dados.nomeTimeCoracaoMesSorte || "";
        }

        if (this.loteria === "maismilionaria") {
            resultado.trevosSorteados = (dados.trevosSorteados || []).map(
                Number,
            );
        }

        return resultado;
    }
}

module.exports = CaixaAPI;
