// Cache em memória para respostas GET iguais para todos os usuários (ex.: estatísticas,
// que varrem o histórico inteiro a cada chamada). A chave é o caminho, sem query string,
// para ninguém inflar o cache com parâmetros aleatórios.
// O atualizador chama limparCacheRespostas() quando entra concurso novo; o TTL é só
// uma rede de segurança caso a limpeza não aconteça.
const TTL_MS = 60 * 60 * 1000;
const cache = new Map();

function cacheResposta(req, res, next) {
    const chave = req.baseUrl + req.path;
    const item = cache.get(chave);
    if (item && Date.now() - item.em < TTL_MS) {
        return res.json(item.corpo);
    }

    const jsonOriginal = res.json.bind(res);
    res.json = (corpo) => {
        if (res.statusCode === 200 && corpo && corpo.success !== false) {
            cache.set(chave, { corpo, em: Date.now() });
        }
        return jsonOriginal(corpo);
    };
    next();
}

function limparCacheRespostas() {
    cache.clear();
}

module.exports = { cacheResposta, limparCacheRespostas };
