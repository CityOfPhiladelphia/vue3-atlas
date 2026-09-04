// Configuration for switching between Carto and ArcGIS data sources
// Change individual values to 'carto' or 'arcgis' as needed
// 'databridge' routes through the maps-api-proxy queryDatabridge lambda (prod gateway; URL in src/util/databridge.js)

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
  // databridge branch built but DORMANT: li_building_footprints geometry carries the
  // ~0.9m offset (visible at parcel zoom) and building_footprints_3857 500s on every
  // query. Flip to 'databridge' when a shifted footprints table works - bead tracks it.
  liBuildingFootprints: 'arcgis',
  // Note: zoningAppeals not migrated - no ArcGIS service available

  // DorStore
  dorCondos: 'carto',
  dorDocuments: 'carto',

  // NearbyActivityStore
  vacantIndicatorPoints: 'databridge',

  // ZoningStore
  rcos: 'databridge',

  // CityServicesStore
  // controls BOTH schools call sites (fillAllSchools + fillNearbySchools) - they must
  // stay on the same source: the designated-school filter matches feature.id across them
  schools: 'databridge',

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
