import axios from 'axios';

import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore'

export const useVotingStore = defineStore("VotingStore", {
  state: () => {
    return {
      divisions: {},
      pollingPlaces: {},
      electedOfficials: {},
      nextElection: {},
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
      this.fillNextElection();
    },
    async clearAllVotingData() {
      this.divisions = {};
      this.pollingPlaces = {};
      this.electedOfficials = {};
      this.nextElection = {};
      this.electionSplit = {};
      this.loadingVotingData = true;
    },
    async fillDivisions() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillDivisions is running');
      const GeocodeStore = useGeocodeStore();
      const feature = GeocodeStore.aisData.features[0];
      let url = '//services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Political_Divisions/FeatureServer/0/query';

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
      this.divisions = await response.data;
    },
    async fillPollingPlaces() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillPollingPlaces is running');
      const GeocodeStore = useGeocodeStore();
      const feature = GeocodeStore.aisData.features[0];
      let precinct;
      if (feature.properties.election_precinct) {
        precinct = feature.properties.election_precinct;
      } else if (feature.properties.political_division) {
        precinct = feature.properties.political_division;
      }
      let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
      const url = baseUrl += `select ST_X(the_geom) as lng, ST_Y(the_geom) as lat, * from polling_places where precinct ='${precinct}'`;
      const response = await fetch(url);
      this.pollingPlaces = await response.json();
    },
    async fillElectedOfficials() {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillElectedOfficials is running');
      const GeocodeStore = useGeocodeStore();
      const feature = GeocodeStore.aisData.features[0];
      let precinct;
      if (feature.properties.election_precinct) {
        precinct = feature.properties.election_precinct;
      } else if (feature.properties.political_division) {
        precinct = feature.properties.political_division;
      }
      let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
      const url = baseUrl += `WITH split AS (SELECT * FROM splits WHERE precinct = '${precinct}') \
      SELECT eo.*, s.ballot_file_id\
      FROM elected_officials eo, split s \
      WHERE eo.office = 'city_council' AND eo.district = '${feature.properties.council_district_2024}' \
                OR eo.office = 'state_house' AND eo.district = s.state_house \
                OR eo.office = 'state_senate' AND eo.district = s.state_senate \
                OR eo.office = 'us_house' AND eo.district = s.federal_house \
      `;
      const response = await fetch(url);
      this.electedOfficials = await response.json();
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
      const feature = GeocodeStore.aisData.features[0];
      let precinct;
      if (feature.properties.election_precinct) {
        precinct = feature.properties.election_precinct;
      } else if (feature.properties.political_division) {
        precinct = feature.properties.political_division;
      }
      let baseUrl = 'https://phl.carto.com/api/v2/sql?q=';
      const url = baseUrl += `SELECT * FROM splits WHERE precinct = '${precinct}'`;
      // const url = baseUrl += `select ST_X(the_geom) as lng, ST_Y(the_geom) as lat, * from polling_places where precinct ='${feature.properties.election_precinct}'`;
      const response = await fetch(url);
      this.electionSplit = await response.json();
    },
  },
});
