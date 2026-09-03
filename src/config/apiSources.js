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
  // The plain dor_parcel/pwd_parcels tables (carto and databridge) sit ~0.9m off
  // the Esri-served DOR basemap (no NAD83->WGS84 datum shift in the postgres->carto
  // paths, while Esri applies one). The databridge branch queries the *_3857 tables
  // instead, which carry the shift and land within ~0.2m of the AGO geometry -
  // verified against mapreg 089N040106 / parcelid 79436. The carto branch still
  // uses the offset tables: break-glass only.
  pwdParcels: 'databridge',
  dorParcels: 'databridge',
};
