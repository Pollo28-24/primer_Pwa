/**
 * ============================================================================
 * PWA INSTALL MODULE (pwa.install.js)
 * ============================================================================
 * Manejo del ciclo de vida de instalación de la Progressive Web App.
 * Responsabilidades:
 *  - Detección de entorno Standalone (evita mostrar el botón si ya está instalada).
 *  - Captura no intrusiva del evento 'beforeinstallprompt'.
 *  - Interacción con el usuario (prompt() y userChoice).
 *  - Limpieza de referencias en el evento 'appinstalled'.
 *  - Degradación elegante en navegadores incompatibles (ej. Safari / iOS).
 */

(function (window, document) {
  "use strict";

  let deferredPrompt = null;
  let installBtn = null;

  /**
   * Determina si la aplicación ya se está ejecutando instalada en modo Standalone.
   * Compatible con especificación W3C y navegadores iOS/WebKit.
   */
  function isRunningStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  /**
   * Muestra el botón de instalación con una suave transición de opacidad (150-200ms).
   */
  function showInstallButton() {
    if (!installBtn || isRunningStandalone()) return;

    installBtn.hidden = false;
    // Forzar reflow leve para permitir la transición de opacidad de 0 a 1
    requestAnimationFrame(() => {
      installBtn.classList.add("visible");
    });
  }

  /**
   * Oculta el botón de instalación y limpia sus clases de estado.
   */
  function hideInstallButton() {
    if (!installBtn) return;

    installBtn.classList.remove("visible");
    installBtn.hidden = true;
  }

  /**
   * Manejador del clic en el botón de instalación.
   */
  async function handleInstallClick() {
    if (!deferredPrompt) {
      console.warn("[PWA Install] No hay ningún evento deferredPrompt disponible.");
      return;
    }

    // Deshabilitar temporalmente para prevenir múltiples clics concurrentes
    installBtn.disabled = true;

    try {
      // 1. Desplegar el diálogo nativo de instalación
      await deferredPrompt.prompt();

      // 2. Esperar la decisión del usuario
      const choiceResult = await deferredPrompt.userChoice;
      console.log(`[PWA Install] Elección del usuario: ${choiceResult.outcome}`);

      if (choiceResult.outcome === "accepted") {
        console.log("[PWA Install] El usuario aceptó la instalación.");
      } else {
        console.log("[PWA Install] El usuario canceló la instalación.");
      }
    } catch (error) {
      console.error("[PWA Install] Error durante el proceso de instalación:", error);
    } finally {
      // 3. El evento solo puede usarse una vez; limpiamos la referencia y ocultamos el botón
      deferredPrompt = null;
      hideInstallButton();
      installBtn.disabled = false;
    }
  }

  /**
   * Inicializa los listeners y conecta el botón en el DOM.
   */
  function init() {
    // Si la app ya está corriendo instalada, no se hace nada
    if (isRunningStandalone()) {
      console.log("[PWA Install] Aplicación ejecutándose en modo Standalone.");
      return;
    }

    installBtn = document.getElementById("pwa-install-btn");
    if (installBtn) {
      installBtn.addEventListener("click", handleInstallClick);
    }

    // Capturar el evento beforeinstallprompt (Chromium / Edge / Android)
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevenir el banner automático intrusivo del navegador
      e.preventDefault();

      // Guardar el evento para dispararlo cuando el usuario lo decida
      deferredPrompt = e;
      console.log("[PWA Install] Evento 'beforeinstallprompt' capturado y disponible.");

      // Revelar el botón contextual de forma discreta
      showInstallButton();
    });

    // Escuchar cuando la instalación se completa efectivamente
    window.addEventListener("appinstalled", () => {
      console.log("[PWA Install] ¡Aplicación instalada exitosamente en el sistema!");
      deferredPrompt = null;
      hideInstallButton();
    });
  }

  // Inicialización cuando el DOM esté disponible
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
