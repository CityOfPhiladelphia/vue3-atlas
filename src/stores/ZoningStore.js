import axios from 'axios';

import { defineStore } from 'pinia';
import { useParcelsStore } from './ParcelsStore';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'

import useTransforms from '@/composables/useTransforms';
const { rcoPrimaryContact, phoneNumber, date } = useTransforms();

import { format } from 'date-fns';

import { polygon, featureCollection } from '@turf/helpers';
import area from '@turf/area';
import intersect from '@turf/intersect';

export const useZoningStore = defineStore('ZoningStore', {
  state: () => {
    return {
      zoningBase: {},
      loadingZoningBase: false,
      zoningOverlays: {},
      loadingZoningOverlays: false,
      pendingBills: {},
      loadingPendingBills: false,
      zoningAppeals: {},
      loadingZoningAppeals: false,
      rcos: {},
      loadingRcos: false,
      loadingZoningData: true,
      proposedZoning: {},
      loadingProposedZoning: false,
    };
  },
  actions: {
    async fillAllZoningData() {
      await this.fillZoningBase();
      await this.fillZoningOverlays();
      await this.fillPendingBills();
      await this.fillZoningAppeals();
      await this.fillProposedZoning();
      await this.fillRcos();
    },
    async clearAllZoningData() {
      this.zoningBase = {};
      this.loadingZoningBase = true;
      this.zoningOverlays = {};
      this.loadingZoningOverlays = true;
      this.pendingBills = {};
      this.loadingPendingBills = true;
      this.zoningAppeals = {};
      this.loadingZoningAppeals = true;
      this.rcos = {};
      this.loadingRcos = true;
      this.loadingZoningData = true;
      this.proposedZoning = {};
      this.loadingProposedZoning = true;
    },
    async fillZoningBase() {
      try {
        const ParcelsStore = useParcelsStore();
        const features = ParcelsStore.dor.features;
        if (!features) return;
        for (let feature of features) {
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          const mapreg = feature.properties.mapreg;
          const query = "\
            WITH all_zoning AS \
              ( \
                SELECT * \
                FROM   phl.zoning_basedistricts \
              ), \
            parcel AS \
              ( \
                SELECT * \
                FROM   phl.dor_parcel \
                WHERE  dor_parcel.mapreg = '" + mapreg + "' \
              ), \
            zp AS \
              ( \
                SELECT all_zoning.* \
                FROM   all_zoning, parcel \
                WHERE  St_intersects(parcel.the_geom, all_zoning.the_geom) \
              ), \
            combine AS \
              ( \
                SELECT zp.objectid, \
                zp.long_code, \
                zp.pending, \
                zp.pendingbill, \
                zp.pendingbillurl, \
                St_area(St_intersection(zp.the_geom, parcel.the_geom)) / St_area(parcel.the_geom) AS overlap_area \
                FROM zp, parcel \
              ), \
            total AS \
              ( \
                SELECT long_code, pending, pendingbill, pendingbillurl, sum(overlap_area) as sum_overlap_area \
                FROM combine \
                GROUP BY long_code, pending, pendingbill, pendingbillurl \
              ) \
            SELECT * \
            FROM total \
            WHERE sum_overlap_area >= 0.01";
          const url = baseUrl += query;
          const response = await fetch(url);
          if (response.ok) {
            this.zoningBase[feature.properties.objectid] = await response.json();
            this.loadingZoningBase = false;
          } else {
            this.loadingZoningBase = false;
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillZoningBase - await resolved but HTTP status was not successful');
          }
        }
      } catch {
        this.loadingZoningBase = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillZoningBase - await never resolved, failed to fetch data');
      }
    },
    async fillProposedZoning() {
      const ParcelsStore = useParcelsStore();
      const features = ParcelsStore.dor.features;
      if (!features) return;
      for (let feature of features) {
        try {
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          const mapreg = feature.properties.mapreg;
          console.log('fillProposedZoning - mapreg:', mapreg);
          const query = "WITH all_proposed_zoning AS ( SELECT * FROM phl.proposedzoning_imp_public ), \
            parcel AS \
              ( SELECT * FROM phl.dor_parcel WHERE dor_parcel.mapreg = '" + mapreg + "' ), \
            zp_overlaps AS \
              ( SELECT all_proposed_zoning.* FROM all_proposed_zoning, parcel WHERE st_overlaps(parcel.the_geom, all_proposed_zoning.the_geom)), \
            zp_intersects AS \
              ( SELECT all_proposed_zoning.* FROM all_proposed_zoning, parcel WHERE st_intersects(parcel.the_geom, all_proposed_zoning.the_geom)) \
            SELECT * FROM zp_overlaps UNION SELECT * FROM zp_intersects";
          // const query = "WITH all_proposed_zoning AS ( SELECT * FROM phl.proposedzoning_imp_public ), \
          //   parcel AS \
          //     ( SELECT * FROM phl.dor_parcel WHERE dor_parcel.mapreg = '" + mapreg + "' ), \
          //   zp AS \
          //     ( SELECT all_proposed_zoning.* FROM all_proposed_zoning, parcel WHERE st_overlaps(parcel.the_geom, all_proposed_zoning.the_geom)) \
          //   SELECT * \
          //   FROM zp";
          const url = baseUrl += query;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (import.meta.env.VITE_DEBUG == 'true') console.log('data:', data);
            data.rows.forEach(item => {
              if (import.meta.env.VITE_DEBUG == 'true') console.log('item:', item);
              item.bill_number_link = `<a target='_blank' href='${item.bill_url_updated}'>${item.bill_number_txt} <i class='fas fa-external-link'></i></a>`;
              if (!!item.enacted_date && format(item.enacted_date, 'yyyy') === '1899') {
                console.log('format(item.enacted_date, "yyyy"):', format(item.enacted_date, 'yyyy'));
                item.formatted_enacted_date = 'N/A';
              } else if (!!item.enacted_date && item.remap_status == 'Enacted') {
                item.formatted_enacted_date = date(item.enacted_date, 'MM/dd/yyyy');
              } else {
                item.formatted_enacted_date = 'N/A';
              }
              if (item.existcode == 'Pre2012' || item.existcode == 'Multi' || item.existcode == null) {
                item.formatted_existcode = 'Refer to bill';
              } else {
                item.formatted_existcode = item.existcode;
              }
              if (item.propzone == 'Pre2012' || item.propzone == 'Multi' || item.propzone == null) {
                item.formatted_propzone = 'Refer to bill';
              } else {
                item.formatted_propzone = item.propzone;
              }
            })
            this.proposedZoning[feature.properties.objectid] = data;
            this.loadingProposedZoning = false;
          } else {
            this.loadingProposedZoning = false;
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillProposedZoning - await resolved but HTTP status was not successful');
          }
        } catch {
          this.loadingProposedZoning = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.error('fillZoningOverlays - await never resolved, failed to fetch data');
        }
      }
    },
    // this is used by fillProposedZoningAGO which is no longer used now that proposedzoning_imp_public is in Carto
    reduceCoordinates(coordinates) {
      let xyCoordsReduced = [];
      let xyCoords = coordinates;

      for (let i = 0; i < xyCoords.length; i++) {
        let newXyCoordReduced;
        if (xyCoords.length > 20 && i%3 == 0) {
          // if (import.meta.env.VITE_DEBUG) console.log('i:', i, 'xyCoords.length:', xyCoords.length, 'i%3:', i%3);
          newXyCoordReduced = [ parseFloat(xyCoords[i][0].toFixed(6)), parseFloat(xyCoords[i][1].toFixed(6)) ];
          xyCoordsReduced.push(newXyCoordReduced);
        } else if (xyCoords.length <= 20) {
          // if (import.meta.env.VITE_DEBUG) console.log('i:', i, 'xyCoords[i]:', xyCoords[i]);
          newXyCoordReduced = [ parseFloat(xyCoords[i][0].toFixed(6)), parseFloat(xyCoords[i][1].toFixed(6)) ];
          xyCoordsReduced.push(newXyCoordReduced);
        }
      }
      console.log('xyCoordsReduced[xyCoordsReduced.length - 1]:', xyCoordsReduced[xyCoordsReduced.length - 1]);
      if (xyCoordsReduced[xyCoordsReduced.length - 1] !== xyCoordsReduced[0]) {
        xyCoordsReduced.push(xyCoordsReduced[0]);
      }
      return xyCoordsReduced;
    },
    // this function requires that all proposed zoning overlaps found must cover at least 5% of the query polygon
    filterProposedZoningFeatures(features, queryPolygon) {
      const filteredFeatures = features.filter(feature => {
        try {
          const featureGeom = polygon(feature.geometry.coordinates);
          const intersection = intersect(
            featureCollection([queryPolygon, featureGeom]),
          );
          if (!intersection) return false;
          const intersectionArea = area(intersection);
          const queryPolygonArea = area(queryPolygon);
          const percentIntersection = (intersectionArea / queryPolygonArea) * 100;
          return percentIntersection > 5;
        } catch (error) {
          console.error('Error processing feature:', error);
          return false;
        }
      });
      return filteredFeatures;
    },
    // this is the old way of filling proposed zoning, it is no longer used now that proposedzoning_imp_public is in Carto
    // it is preserved here, in case we need to revert to it in the future
    async fillProposedZoningAGO() {
      const ParcelsStore = useParcelsStore();
      const features = ParcelsStore.dor.features;
      if (!features) return;
      for (let feature of features) {
        const featurePendingBills = this.pendingBills[feature.properties.objectid] || [];
        const pendingBillIds = featurePendingBills.map(bill => bill.pendingbill);
        let url = '//services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Proposed_Zoning_Implementation_Public/FeatureServer/0/query';

        let xyCoordsReduced = this.reduceCoordinates(feature.geometry.coordinates[0]);

        let params = {
          'returnGeometry': true,
          'where': "bill_number_txt NOT IN ('" + pendingBillIds.join("', '") + "')",
          'outSR': 4326,
          'outFields': '*',
          'inSr': 4326,
          'geometryType': 'esriGeometryPolygon',
          'spatialRel': 'esriSpatialRelIntersects',
          'f': 'geojson',
          'geometry': JSON.stringify({ "rings": [xyCoordsReduced], "spatialReference": { "wkid": 4326 }}),
        };

        const response = await axios.get(url, { params });
        if (response.status === 200) {
          let data = await response.data;

          const queryPolygon = polygon([xyCoordsReduced]);
          data.features = this.filterProposedZoningFeatures(data.features, queryPolygon);

          data.features.forEach(item => {
            if (import.meta.env.VITE_DEBUG == 'true') console.log('item:', item);
            item.properties.bill_number_link = `<a target='_blank' href='${item.properties.bill_url_updated}'>${item.properties.bill_number_txt} <i class='fas fa-external-link'></i></a>`;
            if (!!item.properties.enacted_date && format(item.properties.enacted_date, 'yyyy') === '1899') {
              console.log('format(item.properties.enacted_date, "yyyy"):', format(item.properties.enacted_date, 'yyyy'));
              item.properties.formatted_enacted_date = 'N/A';
            } else if (!!item.properties.enacted_date && item.properties.remap_status == 'Enacted') {
              item.properties.formatted_enacted_date = date(item.properties.enacted_date, 'MM/dd/yyyy');
            } else {
              item.properties.formatted_enacted_date = 'N/A';
            }
            if (item.properties.existcode == 'Pre2012' || item.properties.existcode == 'Multi' || item.properties.existcode == null) {
              item.properties.formatted_existcode = 'Refer to bill';
            } else {
              item.properties.formatted_existcode = item.properties.existcode;
            }
            if (item.properties.propzone == 'Pre2012' || item.properties.propzone == 'Multi' || item.properties.propzone == null) {
              item.properties.formatted_propzone = 'Refer to bill';
            } else {
              item.properties.formatted_propzone = item.properties.propzone;
            }
          })

          this.proposedZoning[feature.properties.objectid] = data;
          this.loadingProposedZoning = false;
        } else {
          this.loadingProposedZoning = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillProposedZoning - await resolved but HTTP status was not successful');
        }
      }
    },
    async fillZoningOverlays() {
      const ParcelsStore = useParcelsStore();
      const features = ParcelsStore.dor.features;
      if (!features) return;
      for (let feature of features) {
        try {
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          const mapreg = feature.properties.mapreg;
          const query = "WITH all_zoning AS \
              ( SELECT * FROM phl.zoning_overlays ), \
            parcel AS \
              ( SELECT * FROM phl.dor_parcel WHERE dor_parcel.mapreg = '" + mapreg + "' ), \
            zp AS \
              ( SELECT all_zoning.* FROM all_zoning, parcel WHERE st_intersects(parcel.the_geom, all_zoning.the_geom)) \
            SELECT code_section, code_section_link, objectid, overlay_name, overlay_symbol, pending, pendingbill, pendingbillurl, sunset_date, type \
            FROM zp";
          const url = baseUrl += query;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (import.meta.env.VITE_DEBUG == 'true') console.log('data:', data);
            data.rows.forEach(row => {
              row.link = `<a target='_blank' href='${row.code_section_link}'>${row.code_section} <i class='fas fa-external-link'></i></a>`
            });
            this.zoningOverlays[feature.properties.objectid] = data;
            this.loadingZoningOverlays = false;
          } else {
            this.loadingZoningOverlays = false;
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillZoningOverlays - await resolved but HTTP status was not successful');
          }
        } catch {
          this.loadingZoningOverlays = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.error('fillZoningOverlays - await never resolved, failed to fetch data');
        }
      }
    },
    async fillPendingBills() {
      const ParcelsStore = useParcelsStore();
      const features = ParcelsStore.dor.features;
      if (!features) {
        this.loadingPendingBills = false;
        return;
      }
      for (let feature of features) {
        let featureId = feature.properties.objectid;
        let target = this.zoningBase[featureId] || {};
        let data = target.rows || {};
          // data = target.data || target.rows || {};

        // include only rows where pending is true
        const rows = data;
        console.log('featureId:', featureId, 'data:', data, 'rows:', rows);
        const rowsFiltered = rows.filter(row => row.pending === 'Yes');

        // give each pending zoning bill a type of "zoning"
        const rowsFilteredWithType = rowsFiltered.map((row) => {
          row.billType = 'Base District';
          row.currentZoning = row.long_code;
          return row;
        });

        let overlayRowsFilteredWithType = [];

        // append pending overlays
        if (this.zoningOverlays[featureId]) {
          const overlayRows = this.zoningOverlays[featureId].rows;
          const overlayRowsFiltered = overlayRows.filter(row => row.pending === 'Yes');
          overlayRowsFilteredWithType = overlayRowsFiltered.map((row) => {
            row.billType = 'Overlay';
            row.currentZoning = row.overlay_name;
            return row;
          });
        } else {
          overlayRowsFilteredWithType = [];
        }

        // combine pending zoning and overlays
        const zoningAndOverlays = rowsFilteredWithType.concat(overlayRowsFilteredWithType);

        const finalZoningAndOverlays = zoningAndOverlays.map(row => {
          row.pendingBillLink = '<a target="_blank" href="' + row.pendingbillurl + '">' + row.pendingbill + ' <i class="fas fa-external-link"></i></a>';
          return row;
        });

        this.pendingBills[featureId] = finalZoningAndOverlays;
      }
      this.loadingPendingBills = false;
    },
    async fillZoningAppeals() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
        const streetaddress = feature.properties.street_address;
        const pwd_parcel_id = feature.properties.pwd_parcel_id;
        const addressId = feature.properties.li_address_key.replace(/\|/g, "', '");
        const eclipseLocationId = feature.properties.eclipse_location_id.replace(/\|/g, "', '");
        const eclipseQuery = feature.properties.eclipse_location_id ? `addressobjectid IN ('${eclipseLocationId}')` : ``;
        const zoningQuery = `applicationtype in ('Zoning Board of Adjustment', 'RB_ZBA') AND applicationtype is not null`
        const opaQuery = feature.properties.opa_account_num ? ` AND opa_account_num IN ('${ feature.properties.opa_account_num}')` : ``;

        const query = `SELECT * FROM APPEALS WHERE (address = '${ streetaddress }' AND ${zoningQuery} \
          OR addressobjectid IN ('${ addressId }') AND ${zoningQuery} \
          OR parcel_id_num IN ('${ pwd_parcel_id }') AND ${zoningQuery}) \
          ${ opaQuery } AND ${zoningQuery} \
          AND systemofrecord IN ('HANSEN') \
          UNION SELECT * FROM APPEALS WHERE (${eclipseQuery} AND ${zoningQuery}  \
          OR parcel_id_num IN ('${ pwd_parcel_id }') AND ${zoningQuery}) \
          ${ opaQuery } AND ${zoningQuery} \
          AND systemofrecord IN ('ECLIPSE') \
          ORDER BY scheduleddate DESC`;

        const url = baseUrl += query;
        const response = await fetch(url);
        if (response.ok) {
          let data = await response.json();
          console.log('response ok, response:', response, 'data:', data);
          data.rows.forEach((row) => {
            console.log('in loop, row:', row);
            let address = row.address;
            if (row.unit_num && row.unit_num != null) {
              address += ' Unit ' + row.unit_num;
            }
            console.log('in loop, row:', row);
            row.appeallink = `<a target='_blank' href='https://li.phila.gov/Property-History/search/Appeal-Detail?address=${address}&Id=${row.appealnumber}'>${row.appealnumber}<i class='fas fa-external-link'></i></a>`
            row.calendarlink = "<a target='_blank' href='https://li.phila.gov/zba-appeals-calendar/appeal?from=2-7-2000&to=4-7-2050&region=all&Id="+row.appealnumber+"'>"+date(row.scheduleddate, 'MM/dd/yyyy')+" <i class='fa fa-external-link'></i></a>";
            console.log('in loop, row:', row);
          });
          this.zoningAppeals = data;
          this.loadingZoningAppeals = false;
        } else {
          this.loadingZoningAppeals = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillZoningAppeals - await resolved but HTTP status was not successful');
        }
      } catch {
        this.loadingZoningAppeals = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillZoningAppeals - await never resolved, failed to fetch data');
      }
    },

    async fillRcos() {
      try {
        const GeocodeStore = useGeocodeStore();
        const feature = GeocodeStore.aisData.features[0];
        let url = '//services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Zoning_RCO/FeatureServer/0/query';

        let params = {
          'returnGeometry': true,
          'where': "1=1",
          'outSR': 4326,
          'outFields': '*',
          'inSr': 4326,
          'geometryType': 'esriGeometryPoint',
          'spatialRel': 'esriSpatialRelWithin',
          'f': 'geojson',
          'geometry': JSON.stringify({ "x": feature.geometry.coordinates[0], "y": feature.geometry.coordinates[1], "spatialReference": { "wkid": 4326 }}),
        };

        const response = await axios.get(url, { params });
        if (response.status === 200) {
          let data = await response.data;

          data.features.sort((a, b) => {
            if (a.properties.organization_name < b.properties.organization_name) {
              return -1;
            }
            if (a.properties.organization_name > b.properties.organization_name) {
              return 1;
            }
            return 0;
          });

          data.features.forEach(item => {
            item.properties.rco = `<b>${item.properties.organization_name}</b><br>${item.properties.organization_address }`;
            item.properties.contact = `${rcoPrimaryContact(item.properties.primary_name)}<br>${phoneNumber(item.properties.primary_phone)}<br><a target='_blank' href='mailto:${item.properties.primary_email}'>${item.properties.primary_email}</a>`;
            item.properties.website_link = item.properties.websites ? `<a target='_blank' href='${item.properties.websites}'>${item.properties.websites}</a>` : 'No website provided';
          })
          this.rcos = data;
          this.loadingRcos = false;
        } else {
          this.loadingRcos = false;
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillRcos - await resolved but HTTP status was not successful');
        }
      } catch {
        this.loadingRcos = false;
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillRcos - await never resolved, failed to fetch data');
      }
    },
  },
  // keeping formatting getters here in the store only works if the data is not looped
  // through for a horizontal table
  getters: {},
})
