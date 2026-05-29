export const mapsApiEndpoints = {
  "getAgoTok": import.meta.env.VITE_VERSION === "cityatlas" ? import.meta.env.VITE_GETAGOTOK_URL : '',
  "getCycloCreds": import.meta.env.VITE_VERSION === "cityatlas" ? import.meta.env.VITE_GETCYCLOCREDS_URL : '',
  "getCycloRecs": "https://0spy4bb9w1.execute-api.us-east-1.amazonaws.com/getCycloRecs",
  "getCycloTid": "https://0spy4bb9w1.execute-api.us-east-1.amazonaws.com/getCycloTid",
  "getEagleTok": "https://0spy4bb9w1.execute-api.us-east-1.amazonaws.com/getEagleTok",
  "queryAisAddress": "https://0spy4bb9w1.execute-api.us-east-1.amazonaws.com/queryAisAddress"
}
