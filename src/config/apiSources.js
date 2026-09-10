// Configuration for switching between Carto and ArcGIS data sources
// Change individual values to 'carto' or 'arcgis' as needed
// 'databridge' routes through the maps-api-proxy queryDatabridge lambda (prod gateway; URL in src/util/databridge.js)

// MASTER SWITCH: set false to move EVERY call off maps-api-proxy at once (incident
// rollback when the whole lambda/gateway chain is down). Each 'databridge' dataset
// drops to a direct branch - carto, or AGO where that's the dataset's only direct
// branch - and ais drops to direct. The per-dataset values below still control
// routing individually while this is true.
export const USE_PROXY = true;

const PROXY_SOURCES = {
  // AIS geocoding (GeocodeStore, CondosStore; autocomplete is already on the proxy):
  // 'proxy' routes through the maps-api-proxy queryAis lambda with a loud direct
  // fallback; 'direct' skips the proxy chain entirely - the rollback if it's down
  ais: 'proxy',

  // OpaStore
  opaData: 'databridge',

  // LiStore - the databridge branches send the same SQL as carto through the lambda
  buildingCertSummary: 'databridge',
  buildingCerts: 'databridge',
  violations: 'databridge',
  appeals: 'databridge',
  permits: 'databridge',
  inspections: 'databridge',
  businessLicenses: 'databridge',
  // uses building_footprints_3857, which carries the NAD83->WGS84 shift and aligns
  // with the Esri basemap (~0.15m; the plain tables sit ~0.9m off)
  liBuildingFootprints: 'databridge',
  // the two zoning-documents queries (ais_zoning_documents, li_zoning_docs)
  aisZoningDocs: 'databridge',
  eclipseZoningDocs: 'databridge',
  // (zoningAppeals lives in the ZoningStore section below)

  // DorStore
  // dorCondos regimes over the databridge row cap (Naval Square) page server-side
  dorCondos: 'databridge',
  // regmaps over the databridge row cap (worst: 5,346 docs) page server-side
  dorDocuments: 'databridge',
  regmaps: 'databridge',

  // NearbyActivityStore
  vacantIndicatorPoints: 'databridge',
  // the nearby-radius datasets share fetchNearby, which builds per-transport sql
  // (carto the_geom vs databridge shape); fallback goes to direct carto
  nearby311: 'databridge',
  nearbyCrimeIncidents: 'databridge',
  nearbyZoningAppeals: 'databridge',
  nearbyConstructionPermits: 'databridge',
  nearbyDemolitionPermits: 'databridge',
  nearbyUnsafeBuildings: 'databridge',

  // ZoningStore
  rcos: 'databridge',
  // the base/overlays/proposed queries carry per-transport sql (phl. schema + the_geom
  // on carto vs unqualified + shape on databridge), built in the store
  zoningBase: 'databridge',
  zoningOverlays: 'databridge',
  proposedZoning: 'databridge',
  zoningAppeals: 'databridge',

  // VotingStore (these replaced the old VITE_VOTING_DATA_SOURCE env switch; Voting.vue
  // and Map.vue also read these flags to pick the rows-vs-features response shape)
  politicalDivisions: 'databridge',
  pollingPlaces: 'databridge',
  electedOfficials: 'databridge',
  electionSplit: 'databridge',

  // CityServicesStore
  // controls BOTH schools call sites (fillAllSchools + fillNearbySchools) - they must
  // stay on the same source: the designated-school filter matches feature.id across them
  schools: 'databridge',
  policeStations: 'databridge',
  fireStations: 'databridge',
  schoolCatchments: 'databridge',
  // ppr_facilities joined to ppr_website_locatorpoints; per-transport sql built in the store
  nearbyRecreationFacilities: 'databridge',
  // the atlas-specific display labels; the AGO layer this came from was retired
  // upstream 2026-09-10 when the table landed in carto/databridge
  parksRecLocationTypes: 'databridge',

  // ParcelsStore
  // The plain dor_parcel/pwd_parcels tables (carto and databridge) sit ~0.9m off
  // the Esri-served DOR basemap (no NAD83->WGS84 datum shift in the postgres->carto
  // paths, while Esri applies one). The databridge branch queries the *_3857 tables
  // instead, which carry the shift and land within ~0.2m of the AGO geometry -
  // verified against mapreg 089N040106 / parcelid 79436. The carto branch still
  // uses the offset tables: break-glass only.
  pwdParcels: 'databridge',
  dorParcels: 'databridge',
};

export const API_SOURCES = USE_PROXY
  ? PROXY_SOURCES
  : Object.fromEntries(
    Object.entries(PROXY_SOURCES).map(([key, value]) => [
      key,
      value === 'databridge' ? 'carto' : value === 'proxy' ? 'direct' : value,
    ])
  );
