/**
 * Scripts required to import Cyclomedia's StreetSmartApi
 */

const pep_script = {
  src: "https://code.jquery.com/pep/0.4.3/pep.min.js",
  type: "text/javascript",
  integrity: "sha256-ibZWIASZ948myvthXu3qCoTOg8bnJzjMJoYZz1RPg6E=",
  crossorigin: "anonymous"
}

const react_script = {
  src: "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
  type: "text/javascript"
}

const reactDom_script = {
  src: "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
  type: "text/javascript"
}

const streetSmartApi_script = {
  src: "https://streetsmart.cyclomedia.com/api/v24.12/StreetSmartApi.js",
  type: "text/javascript"
}

export const streetSmartApi_scripts = [pep_script, react_script, reactDom_script, streetSmartApi_script]
