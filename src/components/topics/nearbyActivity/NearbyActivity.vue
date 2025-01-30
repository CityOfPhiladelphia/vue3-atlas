<script setup>
import { ref, computed, watch, onMounted } from 'vue';

import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();

import useScrolling from '@/composables/useScrolling';
const { isElementInViewport } = useScrolling();

import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

import Nearby311 from '@/components/topics/nearbyActivity/Nearby311.vue';
import NearbyCrimeIncidents from './NearbyCrimeIncidents.vue';
import NearbyZoningAppeals from './NearbyZoningAppeals.vue';
import NearbyVacantIndicatorPoints from './NearbyVacantIndicatorPoints.vue';
import NearbyConstructionPermits from './NearbyConstructionPermits.vue';
import NearbyDemolitionPermits from './NearbyDemolitionPermits.vue';
import NearbyUnsafeBuildings from './NearbyUnsafeBuildings.vue';

import TextFilter from '@/components/TextFilter.vue';
const textSearch = ref('');

const dataTypes = {
  '311': '311 Requests',
  crimeIncidents: 'Crime Incidents',
  zoningAppeals: 'Zoning Appeals',
  vacantIndicatorPoints: 'Vacant Properties',
  constructionPermits: 'Construction Permits',
  demolitionPermits: 'Demolition Permits',
  unsafeBuildings: 'Unsafe Buildings',
}

const shortDataTypes = {
  '311': 'Requests',
  crimeIncidents: 'Incidents',
  zoningAppeals: 'Appeals',
  vacantIndicatorPoints: 'Properties',
  constructionPermits: 'Permits',
  demolitionPermits: 'Permits',
  unsafeBuildings: 'Buildings',
}

const currentNearbyDataType = computed(() => {
  return MainStore.currentNearbyDataType;
});

const setDataTypeInRouter = (newDataType) => {
  let startQuery = { ...route.query };
  router.push({ name: 'address-topic-and-data', params: { address: MainStore.currentAddress, topic: route.params.topic, data: newDataType }, query: { ...startQuery }});
}

const selectedDataType = ref('nearby311');

const timeIntervalSelected = ref('30');
const timeIntervals = computed(() => {
  let values;
  if (['311', 'constructionPermits', 'demolitionPermits'].includes(currentNearbyDataType.value)) {
    values = {
      30: 'last 30 days',
      90: 'last 90 days',
      365: 'last 1 year',
    };
  } else if (currentNearbyDataType.value == 'crimeIncidents') {
    values = {
      30: 'last 30 days',
      90: 'last 90 days',
    };
  } else if (currentNearbyDataType.value == 'zoningAppeals') {
    values = {
      '0': 'any time',
      '-90': 'last 90 days',
      '90': 'next 90 days',
    }
  }
  return values;
})

watch(() => timeIntervalSelected.value, (newTimeIntervals) => {
  MainStore.currentNearbyTimeInterval = newTimeIntervals;
})

watch(() => selectedDataType.value, (newDataType) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('watch selectedDataType.value, newDataType:', newDataType);
  if (MainStore.currentAddress) {
    setDataTypeInRouter(newDataType);
    MainStore.currentNearbyDataType = newDataType;
    const popup = document.getElementsByClassName('maplibregl-popup');
    if (popup.length) {
      popup[0].remove();
    }
  }
  if (timeIntervals.value) {
    timeIntervalSelected.value = Object.keys(timeIntervals.value)[0]
  }
})

const clickedMarkerId = computed(() => { return MainStore.clickedMarkerId; });

watch(() => clickedMarkerId.value, (newClickedMarkerId) => {
  if (newClickedMarkerId) {
    const el = document.getElementsByClassName(newClickedMarkerId)[0];
    const visible = isElementInViewport(el);
    if (!visible && !MainStore.isMobileDevice) {
      el.scrollIntoView({ block: 'center' });
    }
  }
});

onMounted( () => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('NearbyActivity.vue onMounted is running, route.params.data:', route.params.data);
  selectedDataType.value = route.params.data;
  if (!currentNearbyDataType.value) {
    MainStore.currentNearbyDataType = selectedDataType.value;
  }
  // const topic = document.getElementById('Property-topic');
  // topic.scrollIntoView();
  // const main = document.getElementById('main');
  // const mainScrollTop = main.scrollTop;
  // main.scrollTo(0, mainScrollTop - 80);
})

</script>

<template>
  <section>
    <div
      id="Nearby Activity-description"
      class="topic-info"
    >
      See recent activity near your search address including 311 service requests, crimes, zoning appeals, and more. Hover over a record below to highlight it on the map.
    </div>

    <!-- DATA DROPDOWN-->

    <div class="filter-div columns is-multiline">
      <div class="dropdown nearby-dropdown column is-4 is-12-mobile pt-0 pb-0"> 
        <dropdown
          id="data-dropdown"
          v-model="selectedDataType"
          label="Activity Type"
          :options="dataTypes"
        />
      </div>

      <div
        v-if="selectedDataType != 'vacantIndicatorPoints' && selectedDataType != 'unsafeBuildings'"
        class="dropdown nearby-dropdown column is-3 is-12-mobile pt-0 pb-0"
      >
        <dropdown
          id="time-interval-dropdown"
          v-model="timeIntervalSelected"
          label="Time Interval"
          :options="timeIntervals"
        />
      </div>
      <div class="column is-4 is-12-mobile">
        <TextFilter
          v-model="textSearch"
          :search-label="`Search ${ shortDataTypes[currentNearbyDataType] }`"
          :placeholder="`Search ${ shortDataTypes[currentNearbyDataType] }`"
        />
      </div>
    </div>

    <Nearby311 v-if="currentNearbyDataType == '311'" :time-interval-selected="timeIntervalSelected" :text-search="textSearch" />
    <NearbyCrimeIncidents v-if="currentNearbyDataType == 'crimeIncidents'" :time-interval-selected="timeIntervalSelected" :text-search="textSearch" />
    <NearbyZoningAppeals v-if="currentNearbyDataType == 'zoningAppeals'" :time-interval-selected="timeIntervalSelected" :text-search="textSearch" />
    <NearbyVacantIndicatorPoints v-if="currentNearbyDataType == 'vacantIndicatorPoints'" :time-interval-selected="timeIntervalSelected" :text-search="textSearch" />
    <NearbyConstructionPermits v-if="currentNearbyDataType == 'constructionPermits'" :time-interval-selected="timeIntervalSelected" :text-search="textSearch" />
    <NearbyDemolitionPermits v-if="currentNearbyDataType == 'demolitionPermits'" :time-interval-selected="timeIntervalSelected" :text-search="textSearch" />
    <NearbyUnsafeBuildings v-if="currentNearbyDataType == 'unsafeBuildings'" :time-interval-selected="timeIntervalSelected" :text-search="textSearch" />
  </section>
</template>

<style>

.nearby-dropdown {
  padding: 0px !important;
}

#dd-data-dropdown {
  font-size: 14px;
}

#dd-time-interval-dropdown {
  font-size: 14px;
}

#tb-searchBar {
  font-size: 14px;
}

</style>