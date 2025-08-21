import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useMapStore } from '@/stores/MapStore.js'

import axios from 'axios';
import { point, polygon, lineString } from '@turf/helpers';
import distance from '@turf/distance';
import explode from '@turf/explode';
import nearest from '@turf/nearest-point';

import slugify from 'slugify';

import useTransforms from '@/composables/useTransforms';
const { phoneNumber } = useTransforms();

export const useCityServicesStore = defineStore('CityServicesStore', {
  state: () => {
    return {
      dataError: false,
      loadingData: true,
      esCatchments: null,
      msCatchments: null,
      hsCatchments: null,
      allSchools: null,
      allPoliceStations: null,
      policeStation: null,
      nearbySchools: null,
      nearbyFireStations: null,
      nearbyRecreationFacilities: null,
      elementarySchool: null,
      middleSchool: null,
      highSchool: null,
      dataFields: {
        nearbySchools: {
          title: 'Nearby Schools',
          id_field: 'id',
          info_field: 'school_name_label',
        },
        nearbyFireStations: {
          title: 'Nearby Fire Stations',
          id_field: 'id',
          info_field: 'stationInfo',
        },
        nearbyRecreationFacilities: {
          title: 'Nearby Recreation Facilities',
          id_field: 'id',
          info_field: 'public_name',
        },
      },
      allParksRecLocationTypes: null,
    }
  },
  actions: {
    setDataError(error) {
      this.dataError = error;
    },
    setLoadingData(loading) {
      this.loadingData = loading;
    },
    async clearAllCityServicesData() {
      this.dataError = false;
      this.loadingData = true;
    },
    async fetchData(dataType) {
      if (import.meta.env.VITE_DEBUG) console.log('fetchData is running, dataType:', dataType);
      this.setLoadingData(false);
      const GeocodeStore = useGeocodeStore();
      const coordinates = GeocodeStore.aisData.features[0].geometry.coordinates;
      const MapStore = useMapStore();
      await MapStore.fillBufferForAddress(coordinates[0], coordinates[1], 5820);
      if (dataType === 'public-schools') {
        await this.fillNearbySchools();
      } else if (dataType === 'public-safety') {
        await this.fillNearbyFireStations();
      } else if (dataType === 'recreation-facilities') {
        await this.fillNearbyRecreationFacilities();
      }
    },
    async fillAllCatchments() {
      try {
        const params = {
          where: '1=1',
          outFields: '*',
          f: 'geojson',
        }
        const esResponse = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/SchoolDist_Catchments_ES_TEST/FeatureServer/0/query?', { params });
        if (esResponse.status === 200) {
          const data = esResponse.data;
          this.esCatchments = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyCatchments - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }


        const msResponse = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/SchoolDist_Catchments_MS/FeatureServer/0/query?', { params });
        if (msResponse.status === 200) {
          const data = msResponse.data;
          this.msCatchments = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyCatchments - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }

        const hsResponse = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/SchoolDist_Catchments_HS/FeatureServer/0/query?', { params });
        if (hsResponse.status === 200) {
          const data = hsResponse.data;
          this.hsCatchments = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyCatchments - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }

      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyCatchments - await never resolved, failed to fetch address data');
        this.setLoadingData(false);
        this.setDataError(true);
      }
    },
    async fillAllPoliceStations() {
      const params = {
        where: '1=1',
        outFields: '*',
        f: 'geojson',
      }
      try {
        const response = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Police_Stations/FeatureServer/0/query?', { params });
        if (response.status === 200) {
          const data = response.data;
          this.allPoliceStations = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearby311 - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('allPoliceStations - await never resolved, failed to fetch address data');
        this.setLoadingData(false);
        this.setDataError(true);
      }
    },
    async fillAllSchools() {
      try {
        const params = {
          where: '1=1',
          outFields: '*',
          f: 'geojson',
        }
        const response = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Schools/FeatureServer/0/query?', { params });
        if (response.status === 200) {
          const data = response.data;
          this.allSchools = data;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearby311 - await resolved but HTTP status was not successful');
          this.setLoadingData(false);
          this.setDataError(true);
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearby311 - await never resolved, failed to fetch address data');
        this.setLoadingData(false);
        this.setDataError(true);
      }
    },
    async fillNearbySchools() {

      //let response;
      try {
        this.setLoadingData(true);
        const GeocodeStore = useGeocodeStore();
        const MapStore = useMapStore();
        const buffer = MapStore.bufferForAddress;
        const url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Schools/FeatureServer/0/query?';
        const params = {
          'returnGeometry': true,
          'where': "type_specific IN ('district', 'charter')",
          'outSR': 4326,
          'outFields': '*',
          'inSr': 4326,
          'geometryType': 'esriGeometryPolygon',
          'spatialRel': 'esriSpatialRelContains',
          'f': 'geojson',
          'geometry': JSON.stringify({ "rings": buffer, "spatialReference": { "wkid": 4326 } }),
        };
        const response = await axios.get(url, { params });
        if (response.status === 200) {
          if (import.meta.env.VITE_DEBUG) console.log('this.elementarySchool:', this.elementarySchool, 'this.middleSchool:', this.middleSchool, 'this.highSchool:', this.highSchool);
          const designatedSchools = [this.elementarySchool.id, this.middleSchool.id, this.highSchool.id];
          const data = response.data;

          let features = (data || {}).features;
          const feature = GeocodeStore.aisData.features[0];
          const from = point(feature.geometry.coordinates);

          features = features.filter(feature => !designatedSchools.includes(feature.id)).map(feature => {
            const featureCoords = feature.geometry.coordinates;
            let dist;
            if (Array.isArray(featureCoords[0])) {
              let instance;
              if (feature.geometry.type === 'LineString') {
                instance = lineString([featureCoords[0], featureCoords[1]], { name: 'line 1' });
              } else {
                instance = polygon([featureCoords[0]]);
              }
              const vertices = explode(instance);
              const closestVertex = nearest(from, vertices);
              dist = distance(from, closestVertex, { units: 'miles' });
            } else {
              const to = point(featureCoords);
              dist = distance(from, to, { units: 'miles' });
            }
            // const distFeet = parseInt(dist * 5280);
            feature.properties.distance_mi = dist.toFixed(2) + ' mi';
            feature.properties.schoolInfo = '<b>' + feature.properties.school_name_label + '</b><br>' + feature.properties.street_address + '<br>Philadelphia, PA ' + feature.properties.zip_code + '<br>' + feature.properties.phone_number;
            return feature;
          });

          this.nearbySchools = features;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbySchools - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbySchools - await never resolved, failed to fetch address data');
      }

    },
    async fillNearbyFireStations() {
      try {
        this.setLoadingData(true);
        const GeocodeStore = useGeocodeStore();
        const MapStore = useMapStore();
        const buffer = MapStore.bufferForAddress;
        const url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/Fire_Dept_Facilities/FeatureServer/0/query?';
        const params = {
          'returnGeometry': true,
          'where': 'FIRESTA_ IS NOT NULL',
          'outSR': 4326,
          'outFields': '*',
          'inSr': 4326,
          'geometryType': 'esriGeometryPolygon',
          'spatialRel': 'esriSpatialRelContains',
          'f': 'geojson',
          'geometry': JSON.stringify({ "rings": buffer, "spatialReference": { "wkid": 4326 } }),
        };

        const response = await axios.get(url, { params });
        if (response.status === 200) {
          const data = response.data;

          let features = (data || {}).features;
          const feature = GeocodeStore.aisData.features[0];
          const from = point(feature.geometry.coordinates);

          features = features.map(feature => {
            const featureCoords = feature.geometry.coordinates;
            let dist;
            if (Array.isArray(featureCoords[0])) {
              let instance;
              if (feature.geometry.type === 'LineString') {
                instance = lineString([featureCoords[0], featureCoords[1]], { name: 'line 1' });
              } else {
                instance = polygon([featureCoords[0]]);
              }
              const vertices = explode(instance);
              const closestVertex = nearest(from, vertices);
              dist = distance(from, closestVertex, { units: 'miles' });
            } else {
              const to = point(featureCoords);
              dist = distance(from, to, { units: 'miles' });
            }
            // const distFeet = parseInt(dist * 5280);
            feature.properties.distance_mi = dist.toFixed(2) + ' mi';
            feature.properties.stationInfo = '<b>';
            feature.properties.eng && feature.properties.eng != 0 ? feature.properties.stationInfo += 'Engine ' + feature.properties.eng : '';
            feature.properties.eng && feature.properties.eng != 0 && feature.properties.lad && feature.properties.lad != 0 ? feature.properties.stationInfo += ' / ' : '';
            feature.properties.lad && feature.properties.lad != 0 ? feature.properties.stationInfo += 'Ladder ' + feature.properties.lad : '';
            feature.properties.lad && feature.properties.lad != 0 && feature.properties.med && feature.properties.med != 0 || feature.properties.eng && feature.properties.eng != 0 && feature.properties.med && feature.properties.med != 0 ? feature.properties.stationInfo += ' / ' : '';
            feature.properties.med && feature.properties.med != 0 ? feature.properties.stationInfo += 'Medic ' + feature.properties.med : '';
            feature.properties.stationInfo += '</b>';

            feature.properties.stationInfoAddress = feature.properties.stationInfo + '<br>' + feature.properties.location;
            return feature;
          });

          this.nearbyFireStations = features;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyFireStations - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyFireStations - await never resolved, failed to fetch address data');
      }
    },
    async fillAllParksRecLocationTypes() {
      try {
        const params = {
          where: '1=1',
          outFields: '*',
          f: 'geojson',
        }
        const response = await axios.get('https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/ppr_location_types_atlas/FeatureServer/0/query?', { params });
        if (response.status === 200) {
          const data = response.data;
          this.allParksRecLocationTypes = data.features.map(feature => feature.properties);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('parksRecLocationTypes - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('parksRecLocationTypes - await never resolved, failed to fetch data');
      }
    },
    async fillNearbyRecreationFacilities() {
      try {
        const GeocodeStore = useGeocodeStore();
        this.setLoadingData(true);
        const feature = GeocodeStore.aisData.features[0];
        let dataSource = {
          url: 'https://phl.carto.com/api/v2/sql?',
        };

        const distQuery = "(ST_Distance(pprlp.the_geom::geography, ST_SetSRID(ST_Point("
          + feature.geometry.coordinates[0]
          + "," + feature.geometry.coordinates[1]
          + "),4326)::geography))";

        const latQuery = "ST_Y(pprlp.the_geom)";
        const lngQuery = "ST_X(pprlp.the_geom)";

        let query = `WITH pprf AS (SELECT * FROM ppr_facilities) `
        query += `SELECT pprf.location_type, pprf.public_name, pprf.address, pprf.contact_phone, pprf.location_contact_name, pprf.id, pprf.facility_type, pprf.facility_description, ${distQuery} as distance, ${latQuery} as lat, ${lngQuery} as lng FROM ppr_website_locatorpoints pprlp`
        query += ` LEFT JOIN pprf ON pprf.website_locator_points_link_id = pprlp.linkid`
        query += ` WHERE pprf.facility_is_published='true' and ${distQuery} < 1609.34`;
        // query += ` WHERE pprf.facility_is_published='true' and ${distQuery} < 1609.34`;
        query += ` GROUP BY pprf.location_type, pprf.public_name, pprf.address, pprf.contact_phone, pprf.location_contact_name, pprlp.the_geom, pprf.facility_type, pprf.facility_description, pprf.id`;
        // query += ` GROUP BY pprf.public_name, pprf.address, pprf.contact_phone, pprf.location_contact_name, pprlp.the_geom, pprf.facility_type, pprf.id`;
        query += ` ORDER BY distance`;

        let params = {
          q: query,
        };

        const response = await axios.get(dataSource.url, { params })
        if (response.status === 200) {
          const data = response.data;
          if (import.meta.env.VITE_DEBUG) console.log('nearbyRecreationFacilities, data:', data);
          data.rows.forEach(row => {
            row.distance_mi = (row.distance / 1609.34).toFixed(2) + ' mi';
            if (row.public_name) {
              row.location = `<a target="_blank" href="https://www.phila.gov/parks-rec-finder/#/location/${slugify(row.public_name.toLowerCase())}/${row.id}">${row.public_name}</a><br>${row.address.full}`;
            } else {
              row.location = `<a target="_blank" href="https://www.phila.gov/parks-rec-finder/#/location/${row.public_name}/${row.id}">${row.public_name}</a><br>${row.address}`;
            }

            if (row.contact_phone) {
              row.location += `<br>${phoneNumber(row.contact_phone)}`;
            }

            if (row.location_contact_name && row.location_contact_name.includes('@')) {
              row.location += `<br><a href="mailto:${row.location_contact_name}">${row.location_contact_name}</a>`;
            } else if (row.location_contact_name) {
              row.location += `<br>${row.location_contact_name}`;
            }

            row.features = `Facilities: `;
            if (row.location_type) {
              for (const [i, locType] of row.location_type.entries()) {
                if (this.allParksRecLocationTypes) {
                  const locTypeObj = this.allParksRecLocationTypes.find(type => type.id == locType);
                  if (import.meta.env.VITE_DEBUG) console.log('i:', i, 'locType:', locType, 'locTypeObj:', locTypeObj);
                  if (locTypeObj && i === row.location_type.length - 1) {
                    row.features += `${locTypeObj.display_location_type}`;
                  } else if (locTypeObj) {
                    row.features += `${locTypeObj.display_location_type}, `;
                  } else {
                    row.features += 'Swimming Pool';
                  }
                }
              }
            }
            if (import.meta.env.VITE_DEBUG) console.log('after loop row.features:', row.features);
            if (row.facility_description) {
              row.features += `<br><div class="description">${row.facility_description.split('---')[0]}</div>`;
            }

          });
          this.nearbyRecreationFacilities = data.rows;
          this.setLoadingData(false);
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('nearbyRecreationFacilities - await resolved but HTTP status was not successful');
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('nearbyRecreationFacilities - await never resolved, failed to fetch address data');
      }
    },
  },
});
