// Configuration for switching between Carto and ArcGIS data sources
// Change individual values to 'carto' or 'arcgis' as needed
// 'databridge' calls databridge-api on the MuleSoft gateway (URL in src/util/databridge.js)

// MASTER SWITCH: set false to move EVERY call off databridge at once (incident
// rollback when the gateway/databridge chain is down). Each 'databridge' dataset
// drops to a direct branch - carto, or AGO where that's the dataset's only direct
// branch. The per-dataset values below still control routing individually while
// this is true.
export const USE_DATABRIDGE = true;

const DATABRIDGE_SOURCES = {
  // OpaStore
  opaData: 'databridge',

  // LiStore - the databridge branches send the same SQL as carto to databridge-api
  buildingCertSummary: 'databridge',
  buildingCerts: 'databridge',
  violations: 'databridge',
  appeals: 'databridge',
  permits: 'databridge',
  inspections: 'databridge',
  businessLicenses: 'databridge',
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
};

export const API_SOURCES = USE_DATABRIDGE
  ? DATABRIDGE_SOURCES
  : Object.fromEntries(
    Object.entries(DATABRIDGE_SOURCES).map(([key, value]) => [
      key,
      value === 'databridge' ? 'carto' : value,
    ])
  );
