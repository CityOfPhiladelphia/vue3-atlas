/**
 * Has the same functionality as loading a script in an HTML file between <script></script> tags
 * Only required argument is the script source
 *
 * @param {String} src - url of the script to import
 * @param {String} type - type of script
 * @param {String} integrity - integrity hash of script if available
 * @param {String} crossorigin - typically paired with an integrity hash
 * @param {Boolean} async - if the script should be executed as soon as it finishes downloading
 * @param {Boolean} defer - if the script should wait to execute until after the page has completed loading
 * @returns {Promise(Boolean)} - resolves if the script is successfully downloaded and then appended to the document head
 */

export const loadScript = (src, type = 'text/javascript', integrity = '', crossorigin = '', async = false, defer = false) => {
  return new Promise((resolve, reject) => {
    // check if script src is missing
    if (!src) {
      reject(new Error('No src for script'));
      return;
    }

    // check if script already loaded
    if (document.querySelector(`head script[src="${src}"`)) {
      resolve(true);
      return;
    }

    // create new tag
    const tag = document.createElement("script");
    tag.setAttribute("type", type);
    tag.setAttribute("src", src);
    if (integrity) tag.setAttribute("integrity", integrity);
    if (crossorigin) tag.setAttribute("crossorigin", crossorigin);
    if (async) tag.setAttribute("async", "");
    if (defer) tag.setAttribute("defer", "");

    // check if script loaded
    tag.onload = () => resolve(true);
    tag.onerror = () => reject(new Error('Failed to load script:', src));

    // append tag to document
    document.head.append(tag);
  })
};
