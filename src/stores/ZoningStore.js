import axios from 'axios';

import { defineStore } from 'pinia';
import { useParcelsStore } from './ParcelsStore';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'

import useTransforms from '@/composables/useTransforms';
const { rcoPrimaryContact, phoneNumber, date } = useTransforms();

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
    };
  },
  actions: {
    async fillAllZoningData() {
      this.fillZoningBase();
      this.fillZoningOverlays();
      this.fillPendingBills();
      this.fillZoningAppeals();
      this.fillRcos();
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
    },
    async fillZoningBase() {
      try {
        const ParcelsStore = useParcelsStore();
        const features = ParcelsStore.dor.features;
        if (!features) return;
        for (let feature of features) {
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          const mapreg = feature.properties.MAPREG;
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
            this.zoningBase[feature.properties.OBJECTID] = await response.json();
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
    async fillZoningOverlays() {
      const ParcelsStore = useParcelsStore();
      const features = ParcelsStore.dor.features;
      if (!features) return;
      for (let feature of features) {
        try {
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          const mapreg = feature.properties.MAPREG;
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
              row.link = `<a target='_blank' href='${row.code_section_link}'>${row.code_section}<i class='fas fa-external-link-alt'></i></a>`
            });
            this.zoningOverlays[feature.properties.OBJECTID] = data;
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
        let featureId = feature.properties.OBJECTID,
          target = this.zoningBase[featureId] || {},
          data = target.data || {};

        // include only rows where pending is true
        const { rows=[]} = data;
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
        this.pendingBills[featureId] = zoningAndOverlays;
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
            row.appeallink = `<a target='_blank' href='https://li.phila.gov/Property-History/search/Appeal-Detail?address=${row.address}&Id=${row.appealnumber}'>${row.appealnumber}<i class='fas fa-external-link-alt'></i></a>`
            row.calendarlink = "<a target='_blank' href='https://li.phila.gov/zba-appeals-calendar/appeal?from=2-7-2000&to=4-7-2050&region=all&Id="+row.appealnumber+"'>"+date(row.scheduleddate, 'MM/dd/yyyy')+" <i class='fa fa-external-link-alt'></i></a>";
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
            if (a.properties.ORGANIZATION_NAME < b.properties.ORGANIZATION_NAME) {
              return -1;
            }
            if (a.properties.ORGANIZATION_NAME > b.properties.ORGANIZATION_NAME) {
              return 1;
            }
            return 0;
          });

          data.features.forEach(item => {
            item.properties.rco = `<b>${item.properties.ORGANIZATION_NAME}</b><br>${item.properties.ORGANIZATION_ADDRESS}`;
            item.properties.contact = `${rcoPrimaryContact(item.properties.PRIMARY_NAME)}<br>${phoneNumber(item.properties.PRIMARY_PHONE)}<br><a target='_blank' href='mailto:${item.properties.PRIMARY_EMAIL}'>${item.properties.PRIMARY_EMAIL}</a>`;
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
    }
  },
  // keeping formatting getters here in the store only works if the data is not looped
  // through for a horizontal table
  getters: {},
})