import { loadScript } from "./loadScript";

/**
 * Takes an array of Objects hwere each Object contains the script's source and attributes
 * It will then attempt to download and append each script to the document head
 * Promise will resolve to true if all scripts are sucessfully loaded
 *
 * @param {Array[Object]} scripts
 * @returns {Promise(Boolean)}
 */

export const useExternalModule = async (scripts) => {
  const allLoaded = await Promise.all(Array.from(scripts, (script) => loadScript(script.src, script?.type ?? 'text/javascript', script?.integrity ?? '', script?.crossorigin ?? '', script?.async ?? false, script?.defer ?? false)))
  return new Promise((resolve, reject) => {
    allLoaded.every((value) => value === true) ? resolve(true) : reject(new Error('Failed to load all external scripts'))
  })
};
