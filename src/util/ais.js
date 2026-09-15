import { API_SOURCES } from '@/config/apiSources.js';

// AIS through the maps-api-proxy queryAis lambda - same gateway as databridge; the
// lambda attaches the app's AIS key server-side, identified by the request origin
// (localhost passes client_id explicitly, like the databridge helper does)
const AIS_PROXY_URL = 'https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAis';
// the direct branch is the rollback path when the whole proxy chain is down -
// it must keep working exactly as it always has (no key, like today)
const AIS_DIRECT_URL = 'https://api.phila.gov/ais/v1';

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

// AIS /search through the configured source: proxy first (per the apiSources switch),
// falling back LOUDLY to direct AIS when the proxy fails. Returns the parsed
// response, or null when AIS has no match for the query (a 404 is an answer,
// not a proxy failure - it does not trigger the fallback).
export async function fetchAisSearch(query, flags = {}) {
  const encoded = encodeURIComponent(query);
  if (API_SOURCES.ais === 'proxy') {
    try {
      const params = buildFlags(flags);
      if (import.meta.env.VITE_DEBUG == 'true') {
        params.set('client_id', import.meta.env.VITE_AIS_CLIENTID_ATLAS);
      }
      const response = await fetch(`${AIS_PROXY_URL}/search/${encoded}?${params}`);
      if (response.ok) {
        return response.json();
      }
      if (response.status === 404) {
        return null;
      }
    } catch {
      // fall through to direct below
    }
    console.warn('ais - proxy request failed, falling back to direct AIS');
  }
  const params = buildFlags(flags);
  if (!flags.includeUnits) {
    params.set('include_units', 'false');
  }
  const response = await fetch(`${AIS_DIRECT_URL}/search/${encoded}?${params}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}
