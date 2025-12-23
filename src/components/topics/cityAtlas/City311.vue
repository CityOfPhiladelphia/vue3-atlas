<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { point, featureCollection } from '@turf/helpers';

import { useCity311Store } from '@/stores/City311Store';
const City311Store = useCity311Store();
import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();


import useTransforms from '@/composables/useTransforms';
const { timeReverseFn } = useTransforms();
import useScrolling from '@/composables/useScrolling';
const { isElementInViewport, handleRowClick, handleRowMouseover, handleRowMouseleave } = useScrolling();

import TextFilter from '@/components/TextFilter.vue';
const textSearch = ref('');

const loadingCity311 = computed(() => City311Store.loadingCity311 );

const timeIntervalSelected = ref('30');
const timeIntervals = computed(() => {
  return {
    30: 'last 30 days',
    90: 'last 90 days',
    365: 'last 1 year',
  };
})

const city311 = computed(() => {
  let data;
  if (City311Store.city311.rows) {
    data = [ ...City311Store.city311.rows]
      .filter(item => {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('in filter, item:', item);
      let timeDiff = new Date() - new Date(item.properties.REQUESTED_DATETIME);
      let daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff <= timeIntervalSelected.value;
    }).filter(item => {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('item.properties.ADDRESS:', item.properties.ADDRESS, 'textSearch.value:', textSearch.value);
      return item.properties.ADDRESS.toLowerCase().includes(textSearch.value.toLowerCase())
      || item.properties.SUBJECT.toLowerCase().includes(textSearch.value.toLowerCase());
    });
    data.sort((a, b) => timeReverseFn(a, b, 'properties.REQUESTED_DATETIME'))
  }
  return data;
});
const city311Geojson = computed(() => {
  if (!city311.value) return [point([0,0])];
  return city311.value.map(item => point([item.geometry.coordinates[0], item.geometry.coordinates[1]], { id: item.id, type: 'city311' }));
})
watch (() => city311Geojson.value, async(newGeojson) => {
  const map = MapStore.map;
  if (map.getSource) map.getSource('nearbyActivity').setData(featureCollection(newGeojson));
});

const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });

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

onMounted(() => {
  const map = MapStore.map;
  if (!City311Store.loadingCity311 && city311Geojson.value.length > 0) { map.getSource('nearbyActivity').setData(featureCollection(city311Geojson.value)) }
});
onBeforeUnmount(() => {
  const map = MapStore.map;
  if (map.getSource('nearbyActivity')) { map.getSource('nearbyActivity').setData(featureCollection([point([0,0])])) }
});

const city311TableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'properties.date',
      },
      {
        label: 'Location',
        field: 'properties.ADDRESS',
      },
      {
        label: 'Type',
        field: 'properties.link',
        html: true,
      },
      {
        label: 'Description (not shared with the public)',
        field: 'properties.DESCRIPTION',
      },
      {
        label: 'Distance',
        field: 'properties.distance_ft',
        sortFn: (x, y) => {
          const xSplit = parseInt(x.split(' ')[0]);
          const ySplit = parseInt(y.split(' ')[0]);
          return (xSplit < ySplit ? -1 : (xSplit > ySplit ? 1 : 0));
        },
      },
    ],
    rows: city311.value || [],
  }
});

</script>

<template>
  <div class="filter-div columns is-multiline">
    <div
      class="dropdown nearby-dropdown column is-3 is-12-mobile pt-0 pb-0"
    >
      <dropdown
        id="time-interval-dropdown"
        v-model="timeIntervalSelected"
        label="When?"
        :options="timeIntervals"
      />
    </div>
    <div class="column is-8 is-12-mobile">
      <TextFilter
        v-model="textSearch"
      />
    </div>
  </div>

  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      311 Requests
      <font-awesome-icon
        v-if="loadingCity311"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ city311TableData.rows.length }})</span>
    </h2>
    <div class="horizontal-table">
      <vue-good-table
        id="city311"
        :columns="city311TableData.columns"
        :rows="city311TableData.rows"
        :row-style-class="row => hoveredStateId === row.id ? 'active-hover ' + row.id : 'inactive ' + row.id"
        style-class="table nearby-table"
        :sort-options="{ initialSortBy: {field: 'properties.distance_ft', type: 'asc'}}"
        @row-mouseenter="handleRowMouseover($event, 'id')"
        @row-mouseleave="handleRowMouseleave"
        @row-click="handleRowClick($event, 'id', 'city311')"
      >
        <template #emptystate>
          <div v-if="loadingCity311">
            Loading nearby 311... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else-if="City311Store.dataError">
            Data loading error - try refreshing the page
          </div>
          <div v-else>
            No nearby 311 service requests found for the selected time interval
          </div>
        </template>
      </vue-good-table>
    </div>
  </div>
</template>

<style>

@media
only screen and (max-width: 768px) {

	/*Label the data*/

  #city311 {
    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "Location"; }
    td:nth-of-type(3):before { content: "Type"; }
    td:nth-of-type(4):before { content: "Distance"; }
  }
}

</style>
