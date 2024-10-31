import axios from 'axios';

import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'

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
        if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'carto') {
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          const url = baseUrl += `SELECT *, ST_AsGeoJSON(the_geom) FROM political_divisions WHERE ST_Intersects(the_geom, ST_SetSRID(ST_Point(${feature.geometry.coordinates[0]}, ${feature.geometry.coordinates[1]}), 4326))`;          
          const response = await fetch(url);
          if (response.ok) {
            this.divisions = await response.json();
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillDivisions - await resolved but HTTP status was not successful');
          }
        } else if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'arcgis') {
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
        if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'carto') {
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          const url = baseUrl += `select ST_X(the_geom) as lng, ST_Y(the_geom) as lat, * from polling_places where precinct ='${precinct}'`;
          const response = await fetch(url);
          if (response.ok) {
            this.pollingPlaces = await response.json();
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillPollingPlaces - await resolved but HTTP status was not successful');
          }
        } else if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'arcgis') {

          let baseUrl = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/POLLING_PLACES/FeatureServer/0/query';
          let params = {
            'returnGeometry': true,
            'where': `PRECINCT = '${precinct}'`,
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
        if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'carto') {
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          const url = baseUrl += `SELECT * FROM elected_officials WHERE office = 'city_council' AND district = '${feature.properties.council_district_2024}'`;
          const response = await fetch(url);
          if (response.ok) {
            this.electedOfficials = await response.json();
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillElectedOfficials - await resolved but HTTP status was not successful');
          }
        } else if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'arcgis') {
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
        if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'carto') {
          let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
          const url = baseUrl += `SELECT * FROM splits WHERE precinct = '${precinct}'`;
          const response = await fetch(url);
          if (response.ok) {
            this.electionSplit = await response.json();
          } else {
            if (import.meta.env.VITE_DEBUG == 'true') console.warn('fillElectionSplit - await resolved but HTTP status was not successful');
          }
        } else if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'arcgis') {

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
