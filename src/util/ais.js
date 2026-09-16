// AIS /search on the phila.gov API gateway, identified by the app's client id
const AIS_URL = 'https://api-prod.phila.gov/ais/v1';
const GATEWAY_CLIENT_ID = import.meta.env.VITE_GATEWAY_CLIENT_ID;

function buildFlags(flags) {
  const params = new URLSearchParams();
  if (flags.includeUnits) {
    params.set('include_units', 'true');
  }
  if (flags.opaOnly) {
    params.set('opa_only', 'true');
  }
  if (flags.page) {
    params.set('page', flags.page);
  }
  return params;
}

// AIS /search. Returns the parsed response, or null when AIS has no match for
// the query (a 404 is an answer, not a failure).
export async function fetchAisSearch(query, flags = {}) {
  const encoded = encodeURIComponent(query);
  const params = buildFlags(flags);
  params.set('client_id', GATEWAY_CLIENT_ID);
  const response = await fetch(`${AIS_URL}/search/${encoded}?${params}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}
