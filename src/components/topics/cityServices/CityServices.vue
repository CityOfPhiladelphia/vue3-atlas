<script setup>

import { ref, computed, watch, onMounted } from 'vue';

import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();

import useScrolling from '@/composables/useScrolling';
const { isElementInViewport } = useScrolling();

import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

import NearbySchools from '@/components/topics/cityServices/NearbySchools.vue';
import NearbyPublicSafety from '@/components/topics/cityServices/NearbyPublicSafety.vue';

const selectedDataType = ref('public-schools');
const dataTypes = {
  'public-safety': 'Public Safety',
  'public-schools': 'Public Schools',
  'recreation-facilities': 'Recreation Facilities',
};

const currentCityServicesDataType = computed(() => {
  return MainStore.currentCityServicesDataType;
});

watch(() => selectedDataType.value, (newDataType) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('watch selectedDataType.value, newDataType:', newDataType);
  if (MainStore.currentAddress) {
    setDataTypeInRouter(newDataType);
    MainStore.currentCityServicesDataType = newDataType;
    const popup = document.getElementsByClassName('maplibregl-popup');
    if (popup.length) {
      popup[0].remove();
    }
  }
})

const setDataTypeInRouter = (newDataType) => {
  let startQuery = { ...route.query };
  router.push({ name: 'address-topic-and-data', params: { address: MainStore.currentAddress, topic: route.params.topic, data: newDataType }, query: { ...startQuery }});
}

const clickedMarkerId = computed(() => { return MainStore.clickedMarkerId; });

watch(() => clickedMarkerId.value, (newClickedMarkerId) => {
  if (newClickedMarkerId) {
    // if (import.meta.env.VITE_DEBUG) console.log('watch clickedMarkerId.value, newClickedMarkerId:', newClickedMarkerId);
    const el = document.getElementsByClassName(newClickedMarkerId)[0];
    const visible = isElementInViewport(el);
    if (!visible && !MainStore.isMobileDevice) {
      el.scrollIntoView({ block: 'center' });
    }
  }
});

onMounted( () => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('CityServices.vue onMounted is running, route.params.data:', route.params.data);
  selectedDataType.value = route.params.data;
  if (!currentCityServicesDataType.value) {
    MainStore.currentCityServicesDataType = selectedDataType.value;
  }
})

</script>

<template>
  <section>
    <div
      class="topic-callout"
    >
      This section of Atlas is in beta.  We are continuing to build out information about city services here.  Please submit your ideas and questions via our <a target="_blank" href="https://phila.formstack.com/forms/atlas_feedback_form">Feedback form</a>.
    </div>

    <div
      id="Nearby Facilities-description"
      class="topic-info"
    >
      Find city services and facilities for your search address including schools, libraries, rec centers, trash schedules, police stations, and fire stations. Hover over a facility below to highlight it on the map.  See the full directory of city services at <a target="_blank" href="phila.gov/services">phila.gov/services</a>.
    </div>

    <div class="filter-div columns is-multiline">
      <div class="dropdown nearby-dropdown column is-4 is-12-mobile pt-0 pb-0"> 
        <dropdown
          id="data-dropdown"
          v-model="selectedDataType"
          label="Facility Type"
          :options="dataTypes"
        />
      </div>
    </div>

    <NearbySchools v-if="currentCityServicesDataType == 'public-schools'" />
    <NearbyPublicSafety v-if="currentCityServicesDataType == 'public-safety'" />

  </section>
</template>