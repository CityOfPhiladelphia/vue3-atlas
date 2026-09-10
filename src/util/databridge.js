import axios from 'axios';
import { API_SOURCES } from '@/config/apiSources.js';

export const DATABRIDGE_URL = 'https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryDatabridge/databridge';

// fetches from databridge-api (via the maps-api-proxy lambda), reshaped to a GeoJSON
// FeatureCollection matching the ArcGIS response shape: the envelope is data.features[].properties
// with the geometry as a geom property (select ST_AsGeoJSON(ST_Transform(shape, 4326)) as geom),
// feature.id stamped from objectid, single-poly MultiPolygons unwrapped
// databridge (carto v3) serializes timestamps inconsistently: without a timezone on
// plain selects ('2022-06-15T00:00:00'), and as UTC with milliseconds when the query
// has an ORDER BY ('2024-11-04T00:00:00.000Z'). The tables' date parsing expects old
// carto's form: UTC with a trailing Z and no milliseconds. A naive timestamp is local
// time, so Date() then toISOString() reproduces the old carto value; the millisecond
// form just needs the '.000' stripped.
const NAIVE_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const MILLIS_TIMESTAMP = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.\d{3}Z$/;
function normalizeTimestamps(properties) {
  for (const key of Object.keys(properties)) {
    const value = properties[key];
    if (typeof value !== 'string') {
      continue;
    }
    if (NAIVE_TIMESTAMP.test(value)) {
      properties[key] = new Date(value).toISOString().replace('.000Z', 'Z');
    } else if (MILLIS_TIMESTAMP.test(value)) {
      properties[key] = value.replace(MILLIS_TIMESTAMP, '$1Z');
    }
  }
  return properties;
}

// fetches rows for a dataset through its configured source: databridge first (per the
// named apiSources switch), falling back LOUDLY to direct carto when databridge fails -
// proxy hiccups degrade instead of emptying topics, without silently masking outages
// sql is one string when the same statement runs on both transports, or
// { databridge, carto } when their geometry columns force different statements
export async function fetchRowsWithFallback(sourceKey, sql) {
  const databridgeSql = typeof sql === 'string' ? sql : sql.databridge;
  const cartoSql = typeof sql === 'string' ? sql : sql.carto;
  if (API_SOURCES[sourceKey] === 'databridge') {
    try {
      const data = await fetchDatabridgeRows(databridgeSql);
      if (data) {
        return data;
      }
    } catch {
      // fall through to carto below
    }
    console.warn(`${sourceKey} - databridge request failed, falling back to direct carto`);
  }
  const response = await fetch('https://phl.carto.com/api/v2/sql?q=' + encodeURIComponent(cartoSql));
  if (!response.ok) {
    return null;
  }
  return response.json();
}

// fetches from databridge-api and flattens the envelope to the Carto rows shape:
// { rows: [...] } - for attribute queries with no geometry
export async function fetchDatabridgeRows(sql) {
  const params = { sql };
  // the proxy identifies callers by origin, which localhost is not registered as
  if (import.meta.env.VITE_DEBUG == 'true') {
    params.client_id = import.meta.env.VITE_AIS_CLIENTID_ATLAS;
  }
  const response = await axios(DATABRIDGE_URL, { params });
  if (response.status !== 200 || !response.data.data || !response.data.data.features) {
    return null;
  }
  return { rows: response.data.data.features.map((f) => normalizeTimestamps(f.properties)) };
}

export async function fetchDatabridgeGeoJSON(sql) {
  const params = { sql };
  // the proxy identifies callers by origin, which localhost is not registered as
  if (import.meta.env.VITE_DEBUG == 'true') {
    params.client_id = import.meta.env.VITE_AIS_CLIENTID_ATLAS;
  }
  const response = await axios(DATABRIDGE_URL, { params });
  if (response.status !== 200 || !response.data.data || !response.data.data.features) {
    return null;
  }
  const features = response.data.data.features.map((f) => {
    const { geom, ...properties } = f.properties;
    let geometry = geom;
    if (geometry && geometry.type === 'MultiPolygon' && geometry.coordinates.length === 1) {
      geometry = { type: 'Polygon', coordinates: geometry.coordinates[0] };
    }
    return { type: 'Feature', id: properties.objectid, properties: properties, geometry: geometry };
  });
  return { type: 'FeatureCollection', features: features };
}
