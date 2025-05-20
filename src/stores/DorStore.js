import { defineStore } from 'pinia';
import { useParcelsStore } from './ParcelsStore';
import { useGeocodeStore } from './GeocodeStore';

import bboxPolygon from '@turf/bbox-polygon';
import axios from 'axios';

import useTransforms from '@/composables/useTransforms';
const { date } = useTransforms();

const cleanDorAttribute = function(attr) {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('cleanDorAttribute is running with attr', attr);
  // trim leading and trailing whitespace
  var cleanAttr = attr ? String(attr) : '';
  cleanAttr = cleanAttr.replace(/\s+/g, '');

  // return null for zeros and empty strings
  // if (['', '0'].indexOf(cleanAttr) > -1) {
  //   return null;
  // }

  // return empty for zeros and null
  if ([ null, '0' ].indexOf(cleanAttr) > -1) {
    return '';
  }

  // if (import.meta.env.VITE_DEBUG == 'true') console.log('cleanDorAttribute cleanAttr result:', cleanAttr);
  return cleanAttr;
}

// TODO put this in base config transforms
const concatDorAddress = function(parcel, includeUnit) {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('concatDorAddress is running, parcel:', parcel);
  includeUnit = !!includeUnit;
  var STREET_FIELDS = [ 'STDIR', 'STNAM', 'STDES', 'STDESSUF' ];
  var props = parcel.properties;

  // handle house num
  var addressLow = cleanDorAttribute(props.HOUSE);
  var addressHigh = cleanDorAttribute(props.STEX);
  // maybe should be props.SUF below (it said props.SUFFIX)
  var addressSuffix = cleanDorAttribute(props.SUF);
  var address = addressLow;
  address = address + (addressHigh ? '-' + addressHigh : '');
  address = address + (addressSuffix || '');

  // handle unit
  var unit = cleanDorAttribute(props.UNIT);
  if (unit) {
    unit = '# ' + unit;
  }

  // clean up attributes
  var comps = STREET_FIELDS.map(function(streetField) {
    return props[streetField];
  });
  comps = comps.map(cleanDorAttribute);
  // TODO handle individual address comps (like mapping stex=2 => 1/2)
  // addressLow = comps.HOUSE,
  // addressHigh = comps.STEX,
  // streetPredir = comps.STDIR,
  // streetName = comps.STNAM,
  // streetSuffix = comps.STDES,
  // streetPostdir = comps.STDESSUF,

  // add address to front
  comps = [ address ].concat(comps);

  // add unit to end
  if (includeUnit) {
    comps = comps.concat([ unit ]);
  }

  // remove nulls and concat
  address = comps.filter(Boolean).join(' ');

  // if (import.meta.env.VITE_DEBUG == 'true') console.log('concatDorAddress address result:', address);
  if (address === '') {
    address = 'Parcel has no address';
  }
  if (import.meta.env.VITE_DEBUG == 'true') console.log('concatDorAddress address result:', address);
  return address;
}



export const useDorStore = defineStore("DorStore", {
  state: () => {
    return {
      dorDocuments: {},
      regmaps: {},
      dorCondos: {},
      loadingDorData: true,
    };
  },

  actions: {
    async clearAllDorData() {
      this.loadingDorData = true;
      this.dorDocuments = {};
      this.regmaps = {};
      this.dorCondos = {};
    },
    async fillDorCondos() {
      return new Promise((resolve) => {
        (async () => {
          this.dorCondos = {};
          if (import.meta.env.VITE_DEBUG == 'true') console.log('fillRegmaps is running');
          const ParcelsStore = useParcelsStore();
          const parcels = ParcelsStore.dor.features;
          if (!parcels) return resolve();
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          parcels.forEach(async(feature) => {
            try {
              if (import.meta.env.VITE_DEBUG == 'true') console.log('feature:', feature);
              const url = baseUrl + `select * from condominium where mapref = '${ feature.properties.MAPREG }' and status in (1,3)`;
              const response = await fetch(url);
              if (response.ok) {
                const data = await response.json();
                if (import.meta.env.VITE_DEBUG == 'true') console.log('fillDorCondos data:', data);
                for (let row of data.rows) {
                  row.condo_parcel = row.recmap + '-' + row.condoparcel;
                  row.unit_number = 'Unit #' + row.condounit;
                }
                this.dorCondos[feature.properties.OBJECTID] = data;
                return resolve();
              } else {
                if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillDorCondos - await resolved but HTTP status was not successful');
                return resolve();
              }
            } catch {
              if (import.meta.env.VITE_DEBUG == 'true') console.error('fillDorCondos - await never resolved, failed to fetch data');
              return resolve();
            }
          });
        })();
      });
    },
    async fillRegmaps() {
      return new Promise((resolve) => {
        (async () => {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('fillRegmaps is running');
          this.regmaps = {};
          const ParcelsStore = useParcelsStore();
          const parcels = ParcelsStore.dor.features;
          var xVals = [], yVals = [];

          // loop over parcels
          if (!parcels) return resolve();
          parcels.forEach(function (parcel) {
            var geom = parcel.geometry,
              parts = geom.coordinates;

            // loop over parts (whether it's simple or multipart)
            parts.forEach(function (coordPairs) {
              coordPairs.forEach(function (coordPair) {
                // if the polygon has a hole, it has another level of coord
                // pairs, presumably one for the outer coords and another for
                // inner. for simplicity, add them all.
                var hasHole = Array.isArray(coordPair[0]);

                if (hasHole) {
                  // loop through inner pairs
                  coordPair.forEach(function (innerCoordPair) {
                    var x = innerCoordPair[0],
                      y = innerCoordPair[1];

                    xVals.push(x);
                    yVals.push(y);
                  });
                // for all other polys
                } else {
                  var x = coordPair[0],
                    y = coordPair[1];

                  xVals.push(x);
                  yVals.push(y);
                }
              });
            });
          });

          // take max/min
          var xMin = Math.min.apply(null, xVals);
          var xMax = Math.max.apply(null, xVals);
          var yMin = Math.min.apply(null, yVals);
          var yMax = Math.max.apply(null, yVals);

          // make sure all coords are defined. no NaNs allowed.
          var coordsAreDefined = [ xMin, xMax, yMin, yMax ].every(
            function (coord) {
              return coord;
            },
          );

          // if they aren't
          if (!coordsAreDefined) {
            //  exit with null to avoid an error calling lat lng bounds constructor
            return null;
          }

          // construct geometry
          var bbox = [ xMin, yMin, xMax, yMax ];
          var bounds = bboxPolygon(bbox).geometry;

          if (import.meta.env.VITE_DEBUG == 'true') console.log('regmaps.js, bounds:', bounds);

          let url = '//services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/MASTERMAPINDEX/FeatureServer/0/query'; //+ [relationship](targetGeom);
          let params = {
            'returnGeometry': true,
            'where': '1=1',
            'outSR': 4326,
            'outFields': '*',
            'inSr': 4326,
            'geometryType': 'esriGeometryEnvelope',
            'spatialRel': 'esriSpatialRelIntersects',
            'f': 'geojson',
            'geometry': `{ "xmin": ${bounds.coordinates[0][0][0]}, "ymin": ${bounds.coordinates[0][0][1]}, "xmax": ${bounds.coordinates[0][2][0]}, "ymax": ${bounds.coordinates[0][2][1]}, "spatialReference": { "wkid":4326 }}`,
          };

          try {
            const response = await axios.get(url, { params })
            if (response.status === 200) {
              this.regmaps = response;
              return resolve();
            } else {
              if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillRegmaps - await resolved but HTTP status was not successful');
              return resolve();
            }
          } catch {
            if (import.meta.env.VITE_DEBUG == 'true') console.error('fillRegmaps - await never resolved, failed to fetch data');
            return resolve();
          }
        })();
      });
    },
    async fillDorDocuments() {
      return new Promise((resolve) => {
        (async () => {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('fillDorDocuments is running');

          this.dorDocuments = {};
          const ParcelsStore = useParcelsStore();
          const GeocodeStore = useGeocodeStore();
          const url = `//services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/RTT_SUMMARY/FeatureServer/0/query`;
          
          const where = function(feature) {
            if (import.meta.env.VITE_DEBUG == 'true') console.log('where function is running, feature:', feature);
            // METHOD 1: via address
            var parcelBaseAddress = concatDorAddress(feature);
            var geocode = GeocodeStore.aisData.features[0].properties;
            var where;
          
            // REVIEW if the parcel has no address, we don't want to query
            // WHERE ADDRESS = 'null' (doesn't make sense), so use this for now
            if (!parcelBaseAddress || parcelBaseAddress === 'null'){
              where = "matched_regmap = '" + ParcelsStore.dor.features[0].properties.BASEREG + "'";
            } else {
              // TODO make these all camel case
              var props = GeocodeStore.aisData.features[0].properties,
                address_low = props.address_low,
                address_floor = Math.floor(address_low / 100, 1) * 100,
                address_remainder = address_low - address_floor,
                addressHigh = props.address_high,
                addressCeil = addressHigh || address_low;
          
              // form where clause
              where = "(((ADDRESS_LOW >= " + address_low + " AND ADDRESS_LOW <= " + addressCeil + ")"
                        + " OR (ADDRESS_LOW >= " + address_floor + " AND ADDRESS_LOW <= " + addressCeil + " AND ADDRESS_HIGH >= " + address_remainder + " ))"
                        + " AND STREET_NAME = '" + geocode.street_name
                        + "' AND STREET_SUFFIX = '" + geocode.street_suffix
                        + "' AND (MOD(ADDRESS_LOW,2) = MOD( " + address_low + ",2))";
          
          
          
              if (geocode.street_predir != '') {
                where += " AND STREET_PREDIR = '" + geocode.street_predir + "'";
              }
          
              if (geocode.address_low_suffix != '') {
                where += " AND ADDRESS_LOW_SUFFIX = '" + geocode.address_low_suffix + "'";
              }
          
              if (geocode.address_low_suffix == '') {
                where += " AND COALESCE(ADDRESS_LOW_SUFFIX, '') = ''";
                // where += " AND (ADDRESS_LOW_SUFFIX = '' OR ADDRESS_LOW_SUFFIX = null)";
              }
          
              // this is hardcoded right now to handle dor address suffixes that are actually fractions
              if (geocode.address_low_frac === '1/2') {
                where += " AND ADDRESS_LOW_SUFFIX = '2'"; //+ geocode.address_low_frac + "'";
              }
          
              if (geocode.street_postdir != '') {
                where += " AND STREET_POSTDIR = '" + geocode.street_postdir + "'";
              }
          
              // check for unit num
              var unitNum = cleanDorAttribute(feature.properties.UNIT),
                unitNum2 = geocode.unit_num;
              // if (import.meta.env.VITE_DEBUG == 'true') console.log('unitNum:', unitNum, 'unitNum2:', unitNum2);
          
              if (unitNum) {
                where += " AND unit_num = '" + unitNum + "'";
              } else if (unitNum2 !== '') {
                where += " AND unit_num = '" + unitNum2 + "'";
              }
              
              // where += ")";
              where += ") or matched_regmap = '" + ParcelsStore.dor.features[0].properties.BASEREG + "'";
              where += " or reg_map_id = '" + ParcelsStore.dor.features[0].properties.BASEREG + "'";
            }

            if (import.meta.env.VITE_DEBUG == 'true') console.log('address_low:', address_low, 'address_floor:', address_floor,
              'address_remainder:', address_remainder, 'addressHigh:', addressHigh,
              'addressCeil:', addressCeil, 'geocode.street_predir:', geocode.street_predir,
              'geocode.address_low_suffix:', geocode.address_low_suffix,
              'geocode.address_low_frac:', geocode.address_low_frac,
              'geocode.street_postdir:', geocode.street_postdir, 'unitNum:', unitNum,
              'unitNum2:', unitNum2, 'ParcelsStore.dor.features[0].properties.BASEREG:', ParcelsStore.dor.features[0].properties.BASEREG,
              'where:', where
            )
          
            return where;
          }

          if (!ParcelsStore.dor.features) {
            return resolve();
          }
          // if (import.meta.env.VITE_DEBUG == 'true') console.log('ParcelsStore.dor.features:', ParcelsStore.dor.features);
          for (let feature of ParcelsStore.dor.features) {
            // if (import.meta.env.VITE_DEBUG == 'true') console.log('in loop before try, feature:', feature);
            try {
              // if (import.meta.env.VITE_DEBUG == 'true') console.log('in loop in try, feature:', feature);
              let theWhere = where(feature);
                
              const params = {
                where: theWhere,
                // outFields: '*',
                // outFields: "document_id, display_date, document_type, grantors, grantees, unit_num, matched_regmap, reg_map_id",
                outFields: "document_id, display_date, document_type, grantors, grantees, unit_num",
                returnDistinctValues: 'true',
                returnGeometry: 'false',
                f: 'json',
                sqlFormat: 'standard',
              }

              // if (import.meta.env.VITE_DEBUG == 'true') console.log('params:', params);
              const response = await axios(url, { params });
              if (response.status === 200) {
                const data = response.data;
                data.features.forEach((doc) => {
                  doc.attributes.date = date(doc.attributes.display_date);
                  doc.attributes.link = `<a target='_blank' href='http://epay.phila-records.com/phillyepay/web/integration/document/InstrumentID=${doc.attributes.document_id}&Guest=true'>${doc.attributes.document_id}<i class='fa fa-external-link-alt'></i></a>`;
                })
                this.dorDocuments[feature.properties.OBJECTID] = data;
                // return resolve();
              } else {
                if (import.meta.env.VITE_DEBUG == 'true') console.warn('dorDocs - await resolved but HTTP status was not successful')
                // return resolve();
              }
            } catch {
              if (import.meta.env.VITE_DEBUG == 'true') console.error('dorDocs - await never resolved, failed to fetch data')
              // return resolve();
            }
          }
        return resolve();
        })();
      });
    },
  }
})
