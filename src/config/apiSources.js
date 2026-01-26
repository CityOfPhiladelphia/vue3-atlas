// Configuration for switching between Carto and ArcGIS data sources
// Change individual values to 'carto' or 'arcgis' as needed

export const API_SOURCES = {
  // OpaStore
  opaData: 'arcgis',

  // LiStore - migrated
  buildingCertSummary: 'arcgis',
  buildingCerts: 'arcgis',
  violations: 'arcgis',
  appeals: 'arcgis',

  // LiStore - migrated
  permits: 'arcgis',
  inspections: 'arcgis',
  businessLicenses: 'arcgis',
  // Note: zoningAppeals not migrated - no ArcGIS service available
};
