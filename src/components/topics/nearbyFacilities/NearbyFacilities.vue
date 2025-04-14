<script setup>

import { ref, computed, watch, onMounted } from 'vue';

import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();

import useScrolling from '@/composables/useScrolling';
const { isElementInViewport } = useScrolling();

import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

import NearbySchools from '@/components/topics/nearbyFacilities/NearbySchools.vue';

const selectedDataType = ref('publicSchools');
const dataTypes = {
  publicSafety: 'Public Safety',
  publicSchools: 'Public Schools',
  recreationFacilities: 'Recreation Facilities',
};

const currentNearbyFacilitiesDataType = computed(() => {
  return MainStore.currentNearbyFacilitiesDataType;
});

watch(() => selectedDataType.value, (newDataType) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('watch selectedDataType.value, newDataType:', newDataType);
  if (MainStore.currentAddress) {
    setDataTypeInRouter(newDataType);
    MainStore.currentNearbyFacilitiesDataType = newDataType;
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
    if (import.meta.env.VITE_DEBUG) console.log('watch clickedMarkerId.value, newClickedMarkerId:', newClickedMarkerId);
    const el = document.getElementsByClassName(newClickedMarkerId)[0];
    const visible = isElementInViewport(el);
    if (!visible && !MainStore.isMobileDevice) {
      el.scrollIntoView({ block: 'center' });
    }
  }
});

onMounted( () => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('NearbyFacilities.vue onMounted is running, route.params.data:', route.params.data);
  selectedDataType.value = route.params.data;
  if (!currentNearbyFacilitiesDataType.value) {
    MainStore.currentNearbyFacilitiesDataType = selectedDataType.value;
  }
})

</script>

<template>
  <section>
    <div
      id="Nearby Facilities-description"
      class="topic-info"
    >
      See city facilities located near your search address including schools, libraries, rec centers, police stations, and fire stations. Hover over a facility below to highlight it on the map.
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

    <NearbySchools v-if="currentNearbyFacilitiesDataType == 'publicSchools'" />

  </section>
</template>