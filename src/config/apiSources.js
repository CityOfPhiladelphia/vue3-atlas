// Configuration for switching between Carto and ArcGIS data sources
// Change individual values to 'carto' or 'arcgis' as needed
// opaData also supports 'databridge' (routes through the maps-api-proxy queryDatabridge lambda; sandbox only for now)

export const API_SOURCES = {
  // OpaStore
  opaData: 'databridge',

  // LiStore - migrated
  buildingCertSummary: 'carto',
  buildingCerts: 'carto',
  violations: 'carto',
  appeals: 'carto',

  // LiStore - migrated
  permits: 'carto',
  inspections: 'carto',
  businessLicenses: 'carto',
  // Note: zoningAppeals not migrated - no ArcGIS service available

  // DorStore
  dorCondos: 'carto',
  dorDocuments: 'carto',

  // ParcelsStore
  // NOTE: the carto branches WORK but carto's the_geom is ~0.9m off (NAD83->WGS84
  // datum shift missing from the carto ETL; verified vertex-by-vertex 2026-09-03).
  // Visibly wrong against the DOR basemap at parcel zoom. Use carto only as
  // break-glass in an AGO outage; real fix is upstream in the carto ETL.
  pwdParcels: 'arcgis',
  dorParcels: 'arcgis',
};
