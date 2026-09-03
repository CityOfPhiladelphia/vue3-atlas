import axios from 'axios';

const DATABRIDGE_URL = 'https://0spy4bb9w1.execute-api.us-east-1.amazonaws.com/queryDatabridge/databridge';

// fetches from databridge-api (via the maps-api-proxy lambda), reshaped to a GeoJSON
// FeatureCollection matching the ArcGIS response shape: the envelope is data.features[].properties
// with the geometry as a geom property (select ST_AsGeoJSON(ST_Transform(shape, 4326)) as geom),
// feature.id stamped from objectid, single-poly MultiPolygons unwrapped
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
