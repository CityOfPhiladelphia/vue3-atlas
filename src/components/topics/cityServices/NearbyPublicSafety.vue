<script setup>

import { computed, watch, onMounted } from 'vue';
import { point, featureCollection } from '@turf/helpers';
import bbox from '@turf/bbox';
import buffer from '@turf/buffer';

import maplibregl from 'maplibre-gl';

import { useGeocodeStore } from '@/stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();
import { useCityServicesStore } from '@/stores/CityServicesStore';
const CityServicesStore = useCityServicesStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();
import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();

import useScrolling from '@/composables/useScrolling';
const { handleRowClick, handleRowMouseover, handleRowMouseleave } = useScrolling();

import useTransforms from '@/composables/useTransforms';
const { nth } = useTransforms();

import VerticalTable from '@/components/VerticalTable.vue';

const loadingData = computed(() => CityServicesStore.loadingData);
const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });
const hoveredPoliceStationId = computed(() => { return MainStore.hoveredPoliceStationId; });

const nearbyFireStations = computed(() => {
  return CityServicesStore.nearbyFireStations;
});

const nearbyFireStationsGeojson = computed(() => {
  if (!nearbyFireStations.value) return null;
  return nearbyFireStations.value.map(item => point(item.geometry.coordinates, { id: item.id, type: 'nearbyFireStations' }));
});

watch(() => nearbyFireStationsGeojson.value, (newGeojson) => {
  const currentAddress = point(MapStore.currentAddressCoords);
  if (import.meta.env.VITE_DEBUG == 'true') console.log('watch nearbyFireStationsGeojson.value, newGeojson:', newGeojson, 'policeStation.value', policeStation.value, 'currentAddress:', currentAddress);
  const map = MapStore.map;
  const feat = featureCollection(newGeojson);
  if (import.meta.env.VITE_DEBUG) console.log('watch nearbyFireStationsGeojson.value, feat:', feat);
  if (map.getSource) map.getSource('cityServices').setData(feat);
  const feat2 = featureCollection([policeStation.value, currentAddress, ...newGeojson]);
  const bounds = bbox(buffer(feat2, 2000, {units: 'feet'}));
  map.fitBounds(bounds);
});

const nearbyFireStationsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Station',
        field: 'properties.stationInfoAddress',
        html: true,
      },
      {
        label: 'Distance',
        field: 'properties.distance_mi',
      },
    ],
    rows: nearbyFireStations.value || [],
  }
});

const policeDistrict = computed(() => {
  let district, division;
  if (GeocodeStore.aisData.features && GeocodeStore.aisData.features.length) {
    district = GeocodeStore.aisData.features[0].properties.police_district;
    division = GeocodeStore.aisData.features[0].properties.police_division;
  }
  return "<a href='https://phillypolice.com/" + nth(district) + "-district/' target='_blank'>\
    "+ nth(district) + " Police District (" + division + ") <i class='fa fa-external-link-alt'></i></a>";
});

const policeStation = computed(() => {
  let district;
  let station = {
    properties: {
      LOCATION: 'No nearby police station found',
    },
  };
  if (GeocodeStore.aisData.features && GeocodeStore.aisData.features.length && CityServicesStore.allPoliceStations.features && CityServicesStore.allPoliceStations.features.length) {
    district = GeocodeStore.aisData.features[0].properties.police_district;
    station = CityServicesStore.allPoliceStations.features.find(station => station.properties.DISTRICT_NUMBER === parseInt(district));
  }
  return station;
});

watch(
  () => policeStation.value,
  (newPoliceStation) => {
    if (import.meta.env.VITE_DEBUG) console.log('watch policeStation.value, newPoliceStation:', newPoliceStation);
    CityServicesStore.policeStation = newPoliceStation;
  },
  { immediate: true }
)

const policeVertTableData = computed(() => {
  return [
    {
      label: 'Jurisdictions',
      value: policeDistrict.value,
      // class: 'none',
    },
    {
      label: 'Police Station',
      value: policeStation.value.properties.LOCATION,
      class: policeStation.value.id,
    },
  ];
});

const handleCellClick = () => {
  // if (import.meta.env.VITE_DEBUG) console.log('handleCellClick is running');
  const map = MapStore.map;
  let lngLat = policeStation.value.geometry.coordinates;
  let location = policeStation.value.properties.LOCATION;
  map.flyTo({ center: lngLat });
  const popup = document.getElementsByClassName('maplibregl-popup');
  if (popup.length) {
    popup[0].remove();
  }
  new maplibregl.Popup({ className: 'my-class', offset: 25 })
    .setLngLat(lngLat)
    .setHTML(location)
    .setMaxWidth("300px")
    .addTo(map);
};

const handleCellMouseover = (e) => {
  if (import.meta.env.VITE_DEBUG) console.log('handleCellMouseover is running, e:', e);
  if (e) {
    MainStore.hoveredPoliceStationId = e.toString();
  }
};

const handleCellMouseleave = () => {
  // if (import.meta.env.VITE_DEBUG) console.log('handleCellMouseleave is running, e:', e);
  MainStore.hoveredPoliceStationId = null;
  const popup = document.getElementsByClassName('maplibregl-popup');
  if (popup.length) {
    popup[0].remove();
  }
};

// in order to be able to switch off the topic and come back
onMounted(() => {
  const map = MapStore.map;
  if (map.getSource) {
    // if (import.meta.env.VITE_DEBUG) console.log("NearbySchools.vue onMounted is running, map.getSource('schoolMarkers'):", map.getSource('schoolMarkers'));
    // CityServicesStore.policeStation;
    map.getSource('policeStationMarker').setData(CityServicesStore.policeStation);
  }
})

</script>

<template>

  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Police District
    </h2>
  </div>

  <vertical-table
    table-id="police-district"
    :data="policeVertTableData"
    :hovered-id="hoveredPoliceStationId"
    @clicked-cell="handleCellClick"
    @hovered-cell="handleCellMouseover"
    @unhovered-cell="handleCellMouseleave"
  />
  <a
    class="table-link"
    target="_blank"
    href="https://www.phillypolice.com/district/"
  >See citywide police stations at PhillyPolice.com <font-awesome-icon icon="fa-solid fa-external-link-alt" /></a>

  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Nearby Fire Stations
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearbyFireStationsTableData.rows.length }})</span>
    </h2>
  </div>

  <vue-good-table
    id="nearbyFireStations"
    :columns="nearbyFireStationsTableData.columns"
    :rows="nearbyFireStationsTableData.rows"
    :row-style-class="row => hoveredStateId === row.id ? 'active-hover ' + row.id : 'inactive ' + row.id"
    style-class="table nearby-table"
    :sort-options="{ initialSortBy: {field: 'properties.distance_mi', type: 'asc'}}"
    @row-mouseenter="handleRowMouseover($event, 'id')"
    @row-mouseleave="handleRowMouseleave"
    @row-click="handleRowClick($event, 'id', 'nearbyFireStations')"
  >
    <template #emptystate>
      <div v-if="loadingData">
        Loading nearby fire stations... <font-awesome-icon
          icon="fa-solid fa-spinner"
          spin
        />
      </div>
      <div v-else-if="CityServicesStore.dataError">
        Data loading error - try refreshing the page
      </div>
      <div v-else>
        No nearby fire stations found
      </div>
    </template>
  </vue-good-table>

</template>