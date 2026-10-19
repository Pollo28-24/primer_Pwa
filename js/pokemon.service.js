/**
 * ============================================================================
 * POKEMON SERVICE
 * ============================================================================
 * Capa de infraestructura y datos para la integración con PokeAPI v2.
 * Responsabilidades:
 *  - Peticiones HTTP con fetch() nativo y AbortController (timeout).
 *  - Cache volátil en memoria (Map) para evitar llamadas redundantes.
 *  - Mapeo y saneamiento de datos (DTO -> Modelo de Dominio limpio).
 *  - Diccionario de traducción de tipos y formateo de métricas (kg, m).
 */

(function (window) {
  "use strict";

  const BASE_URL = "https://pokeapi.co/api/v2";
  const TIMEOUT_MS = 8000;

  // Cache en memoria RAM para la sesión actual
  const cache = {
    list: new Map(), // clave: `${limit}_${offset}` -> { items, hasMore, total }
    details: new Map()
  };

  // Diccionario de tipos en español
  const TYPE_TRANSLATIONS = {
    normal: "Normal",
    fire: "Fuego",
    water: "Agua",
    grass: "Planta",
    electric: "Eléctrico",
    ice: "Hielo",
    fighting: "Lucha",
    poison: "Veneno",
    ground: "Tierra",
    flying: "Volador",
    psychic: "Psíquico",
    bug: "Bicho",
    rock: "Roca",
    ghost: "Fantasma",
    dragon: "Dragón",
    steel: "Acero",
    fairy: "Hada",
    dark: "Siniestro"
  };

  // Diccionario de estadísticas en español
  const STAT_TRANSLATIONS = {
    hp: "PS",
    attack: "Ataque",
    defense: "Defensa",
    "special-attack": "Atq. Especial",
    "special-defense": "Def. Especial",
    speed: "Velocidad"
  };

  /**
   * Helper para capitalizar strings (bulbasaur -> Bulbasaur).
   */
  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Extrae el ID numérico de la URL del Pokémon de la API.
   * Ej: "https://pokeapi.co/api/v2/pokemon/25/" -> 25
   */
  function extractIdFromUrl(url) {
    const match = url.match(/\/pokemon\/(\d+)\/?$/);
    return match ? Number(match[1]) : null;
  }

  /**
   * Construye la URL del Artwork oficial en alta resolución.
   */
  function getOfficialArtworkUrl(id) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  /**
   * Ejecuta un fetch con control de timeout por AbortController.
   */
  async function fetchWithTimeout(url, timeoutMs = TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const error = new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Mapea un ítem del listado crudo de PokeAPI al modelo de Card.
   */
  function mapToCardModel(rawItem) {
    const id = extractIdFromUrl(rawItem.url);
    return {
      id,
      name: capitalize(rawItem.name),
      image: getOfficialArtworkUrl(id),
      detailUrl: `./detalle.html?pokemon=${id}`
    };
  }

  /**
   * Mapea el JSON completo de detalle de PokeAPI a nuestro modelo de Dominio.
   * Descarta formalmente campos pesados como moves, game_indices y held_items.
   */
  function mapToDetailModel(rawDetail) {
    // Normalizar tipos
    const types = (rawDetail.types || []).map((t) => {
      const rawName = t.type.name;
      return {
        raw: rawName,
        label: TYPE_TRANSLATIONS[rawName] || capitalize(rawName)
      };
    });

    // Normalizar estadísticas (máximo referencial competitivo: 255)
    const stats = (rawDetail.stats || []).map((s) => {
      const rawName = s.stat.name;
      const baseStat = s.base_stat;
      return {
        key: rawName,
        label: STAT_TRANSLATIONS[rawName] || capitalize(rawName),
        value: baseStat,
        percent: Math.min(Math.round((baseStat / 255) * 100), 100)
      };
    });

    // Altura: decímetros -> metros (ej. 7 -> 0.7 m)
    const heightInMeters = (rawDetail.height / 10).toFixed(1) + " m";

    // Peso: hectogramos -> kilogramos (ej. 69 -> 6.9 kg)
    const weightInKg = (rawDetail.weight / 10).toFixed(1) + " kg";

    return {
      id: rawDetail.id,
      name: capitalize(rawDetail.name),
      image:
        rawDetail.sprites?.other?.["official-artwork"]?.front_default ||
        getOfficialArtworkUrl(rawDetail.id),
      height: heightInMeters,
      weight: weightInKg,
      types,
      stats,
      abilities: (rawDetail.abilities || []).map((a) => capitalize(a.ability.name))
    };
  }

  // API pública del Servicio
  const PokemonService = {
    /**
     * Obtiene el listado de Pokémon mapeado para las Cards.
     * @param {number} limit - Cantidad de ejemplares a solicitar (default: 20).
     * @param {number} offset - Desplazamiento inicial (default: 0).
     */
    async getPokemonList(limit = 20, offset = 0) {
      const cacheKey = `${limit}_${offset}`;
      if (cache.list.has(cacheKey)) {
        return cache.list.get(cacheKey);
      }

      const url = `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`;
      const json = await fetchWithTimeout(url);

      // Obtener los datos con tipos en paralelo y precachear los detalles
      const itemPromises = (json.results || []).map(async (rawItem) => {
        const id = extractIdFromUrl(rawItem.url);
        if (cache.details.has(id)) {
          const cached = cache.details.get(id);
          return {
            id,
            name: cached.name,
            image: cached.image,
            types: cached.types,
            detailUrl: `./detalle.html?pokemon=${id}`
          };
        }

        try {
          const detailUrl = `${BASE_URL}/pokemon/${id}`;
          const rawDetail = await fetchWithTimeout(detailUrl);
          const detailModel = mapToDetailModel(rawDetail);
          cache.details.set(id, detailModel);
          return {
            id,
            name: detailModel.name,
            image: detailModel.image,
            types: detailModel.types,
            detailUrl: `./detalle.html?pokemon=${id}`
          };
        } catch {
          // Fallback limpio al modelo básico si falla una consulta individual
          return mapToCardModel(rawItem);
        }
      });

      const mappedList = await Promise.all(itemPromises);
      const result = {
        items: mappedList,
        hasMore: Boolean(json.next),
        total: json.count
      };

      cache.list.set(cacheKey, result);
      return result;
    },

    /**
     * Obtiene la ficha técnica completa de un Pokémon por ID.
     * @param {number|string} id - ID del Pokémon.
     */
    async getPokemonDetail(id) {
      const numericId = Number(id);
      if (!numericId || numericId <= 0) {
        const error = new Error("ID de Pokémon inválido.");
        error.status = 400;
        throw error;
      }

      if (cache.details.has(numericId)) {
        return cache.details.get(numericId);
      }

      const url = `${BASE_URL}/pokemon/${numericId}`;
      const json = await fetchWithTimeout(url);

      const mappedDetail = mapToDetailModel(json);
      cache.details.set(numericId, mappedDetail);
      return mappedDetail;
    },

    /**
     * Limpia la caché en memoria si fuera necesario.
     */
    clearCache() {
      cache.list.clear();
      cache.details.clear();
    }
  };

  window.PokemonService = PokemonService;
})(window);
