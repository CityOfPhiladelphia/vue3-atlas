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
  // NOTE: the carto AND databridge branches WORK but their geometry is ~0.9m off
  // the Esri-served DOR basemap (uniform 0.16m E / 0.89m S; the postgres->carto
  // paths apply no NAD83->WGS84 datum shift while Esri does - verified
  // vertex-by-vertex on dor_parcel and pwd_parcels, and databridge matches carto
  // to the cm). DEMO: set to databridge on this branch so the offset is visible
  // on dev2. For production use, keep arcgis until the convention is reconciled.
  pwdParcels: 'databridge',
  dorParcels: 'databridge',
};
