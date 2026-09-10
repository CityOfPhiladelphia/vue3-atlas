import axios from 'axios';

import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { API_SOURCES } from '@/config/apiSources.js';
import { fetchRowsWithFallback } from '@/util/databridge.js';

export const useVotingStore = defineStore("VotingStore", {
  state: () => {
    return {
      divisions: {},
      pollingPlaces: {},
      electedOfficials: {},
      // nextElection: {},
      electionSplit: {},
      loadingVotingData: true,
    };
  },
  actions: {
    async fillAllVotingData() {
      const GeocodeStore = useGeocodeStore();
      if (!GeocodeStore.aisData.features) return;
      this.fillDivisions();
      this.fillPollingPlaces();
      this.fillElectedOfficials();
      this.fillElectionSplit();
      // this.fillNextElection();
    },
    async clearAllVotingData() {
      this.divisions = {};
      this.pollingPlaces = {};
      this.electedOfficials = {};
      // this.nextElection = {};
      this.electionSplit = {};
      this.loadingVotingData = true;
    },
    async fillDivisions() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillDivisions is running');
      const GeocodeStore = useGeocodeStore();
      try {
        const feature = GeocodeStore.aisData.features[0];
        if (API_SOURCES.politicalDivisions !== 'arcgis') {
          const addressPoint = `ST_SetSRID(ST_Point(${feature.geometry.coordinates[0]}, ${feature.geometry.coordinates[1]}), 4326)`;
          const data = await fetchRowsWithFallback('politicalDivisions', {
            // the unaliased carto ST_AsGeoJSON lands in a column named st_asgeojson, which
            // Map.vue reads - the databridge alias must match it
            databridge: `SELECT *, ST_AsGeoJSON(ST_Transform(shape, 4326)) as st_asgeojson FROM political_divisions WHERE ST_Intersects(shape, ST_Transform(${addressPoint}, 2272))`,
            carto: `SELECT *, ST_AsGeoJSON(the_geom) FROM political_divisions WHERE ST_Intersects(the_geom, ${addressPoint})`,
          });
          if (data) {
            this.divisions = data;
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillDivisions - await resolved but HTTP status was not successful');
          }
        } else {
          let url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Political_Divisions/FeatureServer/0/query';
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
            this.divisions = await response.data;
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillDivisions - await resolved but HTTP status was not successful');
          }
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillDivisions - await never resolved, failed to fetch data');
      }
    },
    async fillPollingPlaces() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillPollingPlaces is running');
      const GeocodeStore = useGeocodeStore();
      try {
        const feature = GeocodeStore.aisData.features[0];
        let precinct;
        if (feature.properties.election_precinct) {
          precinct = feature.properties.election_precinct;
        } else if (feature.properties.political_division) {
          precinct = feature.properties.political_division;
        }
        if (API_SOURCES.pollingPlaces !== 'arcgis') {
          const data = await fetchRowsWithFallback('pollingPlaces', {
            databridge: `select ST_X(ST_Transform(shape, 4326)) as lng, ST_Y(ST_Transform(shape, 4326)) as lat, * from polling_places where precinct ='${precinct}'`,
            carto: `select ST_X(the_geom) as lng, ST_Y(the_geom) as lat, * from polling_places where precinct ='${precinct}'`,
          });
          if (data) {
            this.pollingPlaces = data;
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillPollingPlaces - await resolved but HTTP status was not successful');
          }
        } else {

          let baseUrl = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/POLLING_PLACES/FeatureServer/0/query';
          let params = {
            'returnGeometry': true,
            'where': `precinct = '${precinct}'`,
            'outSR': 4326,
            'outFields': '*',
            'inSr': 4326,
            'geometryType': 'esriGeometryPoint',
            'f': 'geojson',
          };

          const response = await axios.get(baseUrl, { params });
          if (response.status === 200) {
            let data = await response.data;
            this.pollingPlaces = data;
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillPollingPlaces - await resolved but HTTP status was not successful');
          }
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillPollingPlaces - await never resolved, failed to fetch data');
      }
    },
    async fillElectedOfficials() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillElectedOfficials is running');
      const GeocodeStore = useGeocodeStore();

      try {
        const feature = GeocodeStore.aisData.features[0];
        if (API_SOURCES.electedOfficials !== 'arcgis') {
          const data = await fetchRowsWithFallback('electedOfficials', `SELECT * FROM elected_officials WHERE office = 'city_council' AND district = '${feature.properties.council_district_2024}'`);
          if (data) {
            this.electedOfficials = data;
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillElectedOfficials - await resolved but HTTP status was not successful');
          }
        } else {
          let baseUrl = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/ELECTED_OFFICIALS/FeatureServer/0/query';
          let params = {
            'returnGeometry': false,
            'where': `OFFICE = 'city_council' AND DISTRICT = '${feature.properties.council_district_2024}'`,
            'outSR': 4326,
            'outFields': '*',
            'inSr': 4326,
            'f': 'geojson',
          };

          const response = await axios.get(baseUrl, { params });
          if (response.status === 200) {
            let data = await response.data;
            this.electedOfficials = data;
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillElectedOfficials - await resolved but HTTP status was not successful');
          }
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillElectedOfficials - await never resolved, failed to fetch data');
      }
    },
    async fillNextElection() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillNextElection is running');
      const url = 'https://admin-vote.phila.gov/wp-json/votes/v1/election';
      const response = await fetch(url);
      this.nextElection = await response.json();
    },
    async fillElectionSplit() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillElectionSplit is running');
      const GeocodeStore = useGeocodeStore();

      try {
        const feature = GeocodeStore.aisData.features[0];
        let precinct;
        if (feature.properties.election_precinct) {
          precinct = feature.properties.election_precinct;
        } else if (feature.properties.political_division) {
          precinct = feature.properties.political_division;
        }
        if (API_SOURCES.electionSplit !== 'arcgis') {
          const data = await fetchRowsWithFallback('electionSplit', `SELECT * FROM splits WHERE precinct = '${precinct}'`);
          if (data) {
            this.electionSplit = data;
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillElectionSplit - await resolved but HTTP status was not successful');
          }
        } else {

          let baseUrl = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/SPLITS/FeatureServer/0/query';
          let params = {
            'returnGeometry': false,
            'where': `PRECINCT = '${precinct}'`,
            'outSR': 4326,
            'outFields': '*',
            'inSr': 4326,
            'f': 'geojson',
          };

          const response = await axios.get(baseUrl, { params });
          if (response.status === 200) {
            let data = await response.data;
            this.electionSplit = data;
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillElectionSplit - await resolved but HTTP status was not successful');
          }
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('fillElectionSplit - await never resolved, failed to fetch data');
      }
    },
  },
});
