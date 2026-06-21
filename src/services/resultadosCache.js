// Cache em memória dos resultados
let cache = null;
let cacheTime = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 min (rede de segurança; a invalidação cuida da atualização)

module.exports = {
    get() {
        if (cache && cacheTime && Date.now() - cacheTime < CACHE_TTL) {
            return cache;
        }
        return null;
    },
    set(data) {
        cache = data;
        cacheTime = Date.now();
    },
    invalidate() {
        cache = null;
        cacheTime = null;
        console.log("🧹 Cache de resultados invalidado");
    },
};
