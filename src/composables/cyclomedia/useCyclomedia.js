import { streetSmartApi_scripts } from '@/composables/cyclomedia/cyclomediaScripts';
import { useExternalModule } from '@/composables/externalScripts/useExternalModule';
import { getcyclimediaTIDtoken } from '@/composables/mapsApi/call-api';

/**
   * Loads all the scrpits required to run Cyclomedia's StreetSmartApi
   * Method is an alternative to installing the npm package, or loading the scripts in an HTML file
   *
   * @returns {Boolean} - true if all scripts were loaded successfully
   */
export const loadCyclomedia = async () => {
  try {
    return await useExternalModule(streetSmartApi_scripts)
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 *
 * @returns Functions to load Cyclomedia and its dependent scripts and to handle calls to Cyclomedia's StreetSmartApi
 */

export function useCyclomedia() {
  /**
   *
   * @param {HTMLElement | VueTemplateRef} element - the element where Cyclomedia app will be rendered
   * @returns {Promise}
   */
  const init = async (element, imageId = 'W0E2O3QH') => {
    const tidToken = await getcyclimediaTIDtoken(imageId);
    const initConfig = {
      targetElement: element,
      tid: tidToken,
      apiKey: import.meta.env.VITE_CYCLOMEDIA_API_KEY,
      srs: 'EPSG:4326',
      locale: 'en-us',
      addressSettings: {
        locale: 'en-us',
        database: 'CMDatabase',
      }
    }
    if (!window.StreetSmartApi) {
      throw new Error("Failed to find scripts for running Cyclomedia");
    }
    try {
      await window.StreetSmartApi.init(initConfig);
      return true;
    } catch (error) {
      console.error('StreetSmartApi init failed:', error);
      return false;
    }
  }

  /**
   * Opens the Cyclomedia viewer
   *
   * @param {Object} params - settings for Cyclomedia panel to open with
   * @returns {viewer | null} - returns viewer Object if open is successful
   */
  const open = async (params) => {
    const openConfig = {
      viewerType: window.StreetSmartApi.ViewerType.PANORAMA,
      srs: 'EPSG:4326',
      panoramaViewer: {
        closable: false,
        maximizable: false,
        navbarVisible: false,
        recordingsVisible: false
      }
    }
    if (!window.StreetSmartApi) return null;
    try {
      const response = await window.StreetSmartApi.open(params, openConfig);
      const viewer = await response[0];
      if (import.meta.env.VITE_DEBUG) { console.log('useCyclomedia.js open, viewer:', viewer) }
      for (const overlay of viewer.props.overlays) {
        if (overlay.id === "surfaceCursorLayer" && overlay.visible === true) {
          viewer.toggleOverlay(overlay);
        }
      }
      return viewer;
    } catch (error) {
      console.error('StreetSmartApi open failed:', error);
      return null;
    }

  }

  /**
   * Closes the Cyclomedia viewer
   *
   * @param {HTMLElement | VueTemplateRef} element
   * @returns {null}
   */
  const destroy = async (element) => {
    if (!window.StreetSmartApi) return null;
    try {
      return await window.StreetSmartApi.destroy({ targetElement: element });
    } catch (error) {
      console.error('StreetSmartApi open failed:', error);
      return null;
    }
  }

  return { init, open, destroy }
}
