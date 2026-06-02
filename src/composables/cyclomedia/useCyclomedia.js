import { ref } from "vue";
import { streetSmartApi_scripts } from "@/composables/cyclomedia/cyclomediaScripts";
import { useExternalModule } from "@/composables/externalScripts/useExternalModule";
import { getCyclomediaCreds, getCyclomediaTidToken } from "@/composables/mapsApi/call-api";

/**
 * Loads all the scrpits required to run Cyclomedia's StreetSmartApi
 * Method is an alternative to installing the npm package, or loading the scripts in an HTML file
 *
 * @returns {Boolean} - true if all scripts were loaded successfully
 */
export async function loadCyclomedia() {
  try {
    return await useExternalModule(streetSmartApi_scripts);
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * @returns Functions to load Cyclomedia and to handle calls to Cyclomedia's StreetSmartApi
 */

export function useCyclomedia() {
  const cyclomediaCreds = ref(null)

  /**
   * @param {HTMLElement | VueTemplateRef} element - the element where Cyclomedia app will be rendered
   * @returns {Promise}
   */
  const init = async (element, imageId = "W0E2O3QH") => {
    if (!window.StreetSmartApi) {
      throw new Error("Failed to find scripts for running Cyclomedia");
    }

    switch (import.meta.env.VITE_VERSION) {
      case "atlas": {
        cyclomediaCreds.value = cyclomediaCreds.value ? cyclomediaCreds.value : { tid: await getCyclomediaTidToken(imageId) }
        console.log(cyclomediaCreds.value)
        break
      }
      case 'cityatlas': {
        cyclomediaCreds.value = cyclomediaCreds.value ? cyclomediaCreds.value : await getCyclomediaCreds()
        break
      }
    }

    const initConfig = {
      ...cyclomediaCreds.value,
      targetElement: element,
      apiKey: import.meta.env.VITE_CYCLOMEDIA_API_KEY,
      srs: "EPSG:4326",
      locale: "en-us",
      addressSettings: {
        locale: "en-us",
        database: "CMDatabase",
      },
    };

    try {
      await window.StreetSmartApi.init(initConfig);
      return true;
    } catch (error) {
      console.error("StreetSmartApi init failed:", error);
      return false;
    }
  };

  /**
   * Opens the Cyclomedia viewer
   *
   * @param {Object} params - settings for Cyclomedia panel to open with
   * @returns {viewer | null} - returns viewer Object if open is successful
   */
  const open = async (params) => {
    if (!window.StreetSmartApi) {
      throw new Error("Failed to find scripts for running Cyclomedia");
    }

    const openConfig = {
      viewerType: window.StreetSmartApi.ViewerType.PANORAMA,
      srs: "EPSG:4326",
      panoramaViewer: {
        closable: false,
        maximizable: false,
        navbarVisible: false,
        replace: true,
      },
    };

    try {
      const response = await window.StreetSmartApi.open(params, openConfig);
      const viewer = await response[0];
      if (import.meta.env.VITE_DEBUG) {
        console.log("useCyclomedia.js open, viewer:", viewer);
      }
      for (const overlay of viewer.props.overlays) {
        if (overlay.id === "surfaceCursorLayer" && overlay.visible === true) {
          viewer.toggleOverlay(overlay);
        }
      }
      return viewer;
    } catch (error) {
      console.error("StreetSmartApi open failed:", error);
      return null;
    }
  };

  /**
   * Closes the Cyclomedia viewer
   *
   * @param {HTMLElement | VueTemplateRef} element
   * @returns {null}
   */
  const destroy = async (element) => {
    if (!window.StreetSmartApi) {
      throw new Error("Failed to find scripts for running Cyclomedia");
    }

    try {
      await window.StreetSmartApi.destroy({ targetElement: element });
    } catch (error) {
      console.error("StreetSmartApi destroy failed:", error);
    }
  };

  return { init, open, destroy };
}
