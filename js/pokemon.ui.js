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

  // Estado de paginación incremental
  const PAGE_LIMIT = 20;
  let currentOffset = 0;
  let hasMoreItems = true;
  let isLoadingMore = false;

  /**
   * Actualiza el contenedor de paginación con el botón o el mensaje de fin de lista.
   */
  function updatePaginationUI(hasMore) {
    let paginationContainer = document.getElementById("pokemon-pagination");
    if (!paginationContainer) {
      const catalogSection = document.getElementById("pokemon-catalog");
      if (catalogSection) {
        paginationContainer = document.createElement("div");
        paginationContainer.id = "pokemon-pagination";
        paginationContainer.className = "load-more-container";
        catalogSection.appendChild(paginationContainer);
      } else {
        return;
      }
    }

    if (!hasMore) {
      paginationContainer.innerHTML = `
        <p class="all-loaded-text">✨ ¡Has explorado todos los Pokémon disponibles!</p>
      `;
      return;
    }

    paginationContainer.innerHTML = `
      <button type="button" class="load-more-btn" id="btn-load-more" aria-label="Cargar 20 Pokémon más">
        <span>Cargar más Pokémon</span>
        <span class="btn-icon">⚡</span>
      </button>
    `;

    const btn = document.getElementById("btn-load-more");
    if (btn) {
      btn.addEventListener("click", () => PokemonUI.loadMore());
    }
  }

  // Objeto público de la capa UI
  const PokemonUI = {
    /**
     * Inicializa la sección de Pokémon en el Home (index.html).
     */
    async initHome(containerId = "pokemon-list") {
      const container = document.getElementById(containerId);
      if (!container) return;

      // Reiniciar estado de paginación
      currentOffset = 0;
      hasMoreItems = true;
      isLoadingMore = false;

      // 1. Mostrar estado de carga (Skeletons)
      container.innerHTML = buildSkeletonsHTML(8);

      try {
        // 2. Obtener primera página (offset = 0, limit = 20)
        const result = await window.PokemonService.getPokemonList(PAGE_LIMIT, 0);
        hasMoreItems = result.hasMore;

        // 3. Renderizar listado inicial de Cards
        container.innerHTML = result.items.map(buildCardHTML).join("");

        // 4. Renderizar botón "Cargar más"
        updatePaginationUI(hasMoreItems);
      } catch (error) {
        console.error("PokemonUI: Error al cargar el catálogo de Pokémon:", error);
        container.innerHTML = buildErrorHTML(
          "No pudimos conectar con los servidores de PokeAPI en este momento.",
          "window.PokemonUI.initHome"
        );
      }
    },

    /**
     * Carga el siguiente lote de Pokémon conservando las cards actuales en el DOM.
     */
    async loadMore(containerId = "pokemon-list") {
      if (isLoadingMore || !hasMoreItems) return;

      const container = document.getElementById(containerId);
      const btn = document.getElementById("btn-load-more");
      if (!container || !btn) return;

      isLoadingMore = true;
      btn.disabled = true;
      btn.innerHTML = `
        <span class="spinner-icon">⏳</span>
        <span>Cargando más Pokémon...</span>
      `;

      try {
        const nextOffset = currentOffset + PAGE_LIMIT;
        const result = await window.PokemonService.getPokemonList(PAGE_LIMIT, nextOffset);

        currentOffset = nextOffset;
        hasMoreItems = result.hasMore;

        // Inyectar nuevas cards al final del contenedor sin reemplazar las existentes
        const newCardsHTML = result.items.map(buildCardHTML).join("");
        container.insertAdjacentHTML("beforeend", newCardsHTML);

        // Actualizar estado del botón
        updatePaginationUI(hasMoreItems);
      } catch (error) {
        console.error("PokemonUI: Error al cargar más Pokémon:", error);
        btn.disabled = false;
        btn.innerHTML = `
          <span>⚠️ Error al cargar. Reintentar</span>
        `;
      } finally {
        isLoadingMore = false;
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
