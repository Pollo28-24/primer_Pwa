/**
 * ============================================================================
 * POKEMON UI
 * ============================================================================
 * Capa de presentación para la integración con PokeAPI v2.
 * Responsabilidades:
 *  - Renderizado de Cards de Pokémon en el Catálogo de Inicio.
 *  - Renderizado de la Ficha Técnica en la vista de Detalle.
 *  - Gestión de estados de interfaz: Carga (Skeleton), Error y Éxito.
 *  - Integración no destructiva con el DOM existente.
 */

(function (window) {
  "use strict";

  /**
   * Genera el HTML de los esqueletos de carga (Skeleton Shimmer).
   */
  function buildSkeletonsHTML(count = 8) {
    return Array.from({ length: count })
      .map(
        () => `
        <article class="card card-pokemon card-skeleton" aria-hidden="true">
          <div class="card-media skeleton-shimmer"></div>
          <div class="card-info">
            <div class="skeleton-line skeleton-id skeleton-shimmer"></div>
            <div class="skeleton-line skeleton-title skeleton-shimmer"></div>
            <div class="skeleton-line skeleton-desc skeleton-shimmer"></div>
            <div class="skeleton-btn skeleton-shimmer"></div>
          </div>
        </article>
      `
      )
      .join("");
  }

  /**
   * Genera el HTML para un estado de error con botón de reintento.
   */
  function buildErrorHTML(message, retryFnName) {
    return `
      <div class="pokemon-error-state" role="alert">
        <div class="error-icon">⚠️</div>
        <h3>No se pudo cargar la información</h3>
        <p>${message || "Ocurrió un problema de red al consultar la PokeAPI."}</p>
        <button type="button" class="view-more retry-btn" onclick="${retryFnName}()">
          🔄 Reintentar
        </button>
      </div>
    `;
  }

  /**
   * Genera el HTML de una Card de Pokémon individual.
   */
  function buildCardHTML(pokemon) {
    const formattedId = `#${String(pokemon.id).padStart(3, "0")}`;

    return `
      <article class="card card-pokemon" data-id="${pokemon.id}">
        <div class="card-media">
          <img 
            src="${pokemon.image}" 
            alt="Ilustración oficial de ${pokemon.name}" 
            loading="lazy"
            decoding="async"
            onerror="this.onerror=null; this.src='./imagenes/iconos/icon-192x192.png'; this.classList.add('img-fallback');"
          >
        </div>

        <div class="card-info">
          <span class="pokemon-badge-id">${formattedId}</span>
          <h2>${pokemon.name}</h2>
          <p>Ejemplar sincronizado desde la Pokédex oficial.</p>

          <a class="view-more" href="${pokemon.detailUrl}" aria-label="Ver detalles de ${pokemon.name}">
            Ver detalles
          </a>
        </div>
      </article>
    `;
  }

  /**
   * Genera el HTML para la vista de detalle completa del Pokémon.
   */
  function buildDetailHTML(pokemon) {
    const formattedId = `#${String(pokemon.id).padStart(3, "0")}`;

    const typeBadgesHTML = pokemon.types
      .map(
        (t) =>
          `<span class="pokemon-type-badge type-${t.raw}">${t.label}</span>`
      )
      .join(" ");

    const statsHTML = pokemon.stats
      .map(
        (s) => `
        <div class="stat-row">
          <div class="stat-label-group">
            <span class="stat-name">${s.label}</span>
            <span class="stat-value">${s.value}</span>
          </div>
          <div class="stat-bar-container" role="progressbar" aria-valuenow="${s.value}" aria-valuemin="0" aria-valuemax="255">
            <div class="stat-bar-fill" style="width: ${s.percent}%;"></div>
          </div>
        </div>
      `
      )
      .join("");

    const abilitiesStr =
      pokemon.abilities.length > 0 ? pokemon.abilities.join(", ") : "Ninguna";

    return `
      <article class="detail-content pokemon-detail-content">
        <a class="back-button" href="./index.html#pokemon-catalog">
          ← Volver al catálogo
        </a>

        <div class="detail-media-wrapper">
          <img 
            src="${pokemon.image}" 
            alt="Ilustración oficial de ${pokemon.name}"
            onerror="this.onerror=null; this.src='./imagenes/iconos/icon-512x512.png';"
          >
        </div>

        <div class="detail-info">
          <span class="pokemon-badge-id detail-id">${formattedId}</span>
          <h2>${pokemon.name}</h2>

          <div class="pokemon-types-list" aria-label="Tipos">
            ${typeBadgesHTML}
          </div>

          <div class="product-extra pokemon-specs-grid">
            <h3>Características físicas</h3>
            <p><strong>📏 Altura:</strong> ${pokemon.height}</p>
            <p><strong>⚖️ Peso:</strong> ${pokemon.weight}</p>
            <p><strong>✨ Habilidades:</strong> ${abilitiesStr}</p>
          </div>

          <div class="pokemon-stats-section">
            <h3>Estadísticas base</h3>
            <div class="stats-list">
              ${statsHTML}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // Objeto público de la capa UI
  const PokemonUI = {
    /**
     * Inicializa la sección de Pokémon en el Home (index.html).
     */
    async initHome(containerId = "pokemon-list") {
      const container = document.getElementById(containerId);
      if (!container) return;

      // 1. Mostrar estado de carga (Skeletons)
      container.innerHTML = buildSkeletonsHTML(8);

      try {
        // 2. Obtener datos del servicio
        const pokemonList = await window.PokemonService.getPokemonList(20, 0);

        // 3. Renderizar listado de Cards
        container.innerHTML = pokemonList.map(buildCardHTML).join("");
      } catch (error) {
        console.error("PokemonUI: Error al cargar el catálogo de Pokémon:", error);
        container.innerHTML = buildErrorHTML(
          "No pudimos conectar con los servidores de PokeAPI en este momento.",
          "window.PokemonUI.initHome"
        );
      }
    },

    /**
     * Inicializa la pantalla de detalle de Pokémon (detalle.html).
     */
    async initDetail(pokemonId, containerId = "product-detail-page") {
      const container = document.getElementById(containerId);
      if (!container) return;

      // 1. Mostrar esqueleto de carga para la vista detalle
      container.innerHTML = `
        <article class="detail-content pokemon-detail-content card-skeleton">
          <div class="detail-media-wrapper skeleton-shimmer" style="min-height: 280px;"></div>
          <div class="detail-info">
            <div class="skeleton-line skeleton-title skeleton-shimmer" style="width: 50%;"></div>
            <div class="skeleton-line skeleton-desc skeleton-shimmer" style="width: 80%;"></div>
            <div class="skeleton-line skeleton-desc skeleton-shimmer" style="width: 100%;"></div>
          </div>
        </article>
      `;

      try {
        // 2. Obtener datos del Pokémon
        const pokemon = await window.PokemonService.getPokemonDetail(pokemonId);

        // 3. Renderizar la ficha técnica
        container.innerHTML = buildDetailHTML(pokemon);
        document.title = `${pokemon.name} | Catálogo Pokémon`;
      } catch (error) {
        console.error("PokemonUI: Error al cargar detalle del Pokémon:", error);
        const isNotFound = error.status === 404 || error.status === 400;
        const msg = isNotFound
          ? "El espécimen solicitado no existe o no pudo ser identificado en la Pokédex."
          : "Ocurrió un problema de conexión al consultar la ficha del Pokémon.";

        container.innerHTML = `
          <div class="pokemon-error-state" role="alert">
            <div class="error-icon">🔍</div>
            <h3>Pokémon no disponible</h3>
            <p>${msg}</p>
            <a class="view-more retry-btn" href="./index.html#pokemon-catalog">
              ← Volver al catálogo
            </a>
          </div>
        `;
      }
    }
  };

  window.PokemonUI = PokemonUI;
})(window);
