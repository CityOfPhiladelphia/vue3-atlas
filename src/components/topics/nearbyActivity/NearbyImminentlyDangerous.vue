<script setup type='ts'>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { point, featureCollection } from '@turf/helpers';

import { useNearbyActivityStore } from '@/stores/NearbyActivityStore';
const NearbyActivityStore = useNearbyActivityStore();
import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();

import useTransforms from '@/composables/useTransforms';
const { timeReverseFn } = useTransforms();
import useScrolling from '@/composables/useScrolling';
const { handleRowClick, handleRowMouseover, handleRowMouseleave } = useScrolling();

const loadingData = computed(() => NearbyActivityStore.loadingData );

const props = defineProps({
  timeIntervalSelected: {
    type: String,
    default: '30',
  },
  textSearch: {
    type: String,
    default: '',
  },
})

const nearbyImminentlyDangerous = computed(() => {
  let data;
  if (NearbyActivityStore.nearbyImminentlyDangerous) {
    data = [ ...NearbyActivityStore.nearbyImminentlyDangerous.rows]
      .filter(item => {
      let itemDate = new Date(item.casecreateddate);
      let now = new Date();
      let timeDiff = now - itemDate;
      let daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff <= props.timeIntervalSelected;
    }).filter(item => {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('item.address:', item.address, 'props.textSearch:', props.textSearch);
      return item.address.toLowerCase().includes(props.textSearch.toLowerCase()) || item.link.toLowerCase().includes(props.textSearch.toLowerCase());
    });
    data.sort((a, b) => timeReverseFn(a, b, 'casecreateddate'))
  }
  return data;
});
const nearbyImminentlyDangerousGeojson = computed(() => {
  if (!nearbyImminentlyDangerous.value) return [point([0,0])];
  return nearbyImminentlyDangerous.value.map(item => point([item.lng, item.lat], { id: item.casenumber, type: 'nearbyImminentlyDangerous' }));
})
watch (() => nearbyImminentlyDangerousGeojson.value, (newGeojson) => {
  const map = MapStore.map;
  if (map.getSource) map.getSource('nearby').setData(featureCollection(newGeojson));
});

const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });

onMounted(() => {
  const map = MapStore.map;
  if (!NearbyActivityStore.loadingData && nearbyImminentlyDangerousGeojson.value.length > 0) { map.getSource('nearby').setData(featureCollection(nearbyImminentlyDangerousGeojson.value)) }
});
onBeforeUnmount(() => {
  const map = MapStore.map;
  if (map.getSource('nearby')) { map.getSource('nearby').setData(featureCollection([point([0,0])])) }
});

const nearbyImminentlyDangerousTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'casecreateddate',
        type: 'date',
        dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'Location',
        field: 'address',
      },
      {
        label: 'Type',
        field: 'link',
        html: true,
      },
      {
        label: 'Distance',
        field: 'distance_ft',
        sortFn: (x, y) => {
          const xSplit = parseInt(x.split(' ')[0]);
          const ySplit = parseInt(y.split(' ')[0]);
          return (xSplit < ySplit ? -1 : (xSplit > ySplit ? 1 : 0));
        },
      }
    ],
    rows: nearbyImminentlyDangerous.value || [],
  }
});

</script>

<template>
  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Imminently Dangerous Buildings
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearbyImminentlyDangerousTableData.rows.length }})</span>
    </h2>
    <div class="horizontal-table">
      <vue-good-table
        id="nearbyImminentlyDangerous"
        :columns="nearbyImminentlyDangerousTableData.columns"
        :rows="nearbyImminentlyDangerousTableData.rows"
        :row-style-class="row => hoveredStateId === row.casenumber ? 'active-hover ' + row.casenumber : 'inactive ' + row.casenumber"
        style-class="table nearby-table"
        @row-mouseenter="handleRowMouseover($event, 'casenumber')"
        @row-mouseleave="handleRowMouseleave"
        @row-click="handleRowClick($event, 'casenumber', 'nearbyImminentlyDangerous')"
        :sort-options="{ initialSortBy: {field: 'distance_ft', type: 'asc'}}"
      >
        <template #emptystate>
          <div v-if="loadingData">
            Loading nearby imminently dangerous properties... <font-awesome-icon
              icon="fa-solid fa-spinner"
              spin
            />
          </div>
          <div v-else>
            No nearby imminently dangerous properties found for the selected time interval
          </div>
        </template>
      </vue-good-table>
    </div>
  </div>
</template>

<style>

@media 
only screen and (max-width: 760px),
(min-device-width: 768px) and (max-device-width: 1024px)  {
	/*Label the data*/

  #nearbyImminentlyDangerous {
    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "Location"; }
    td:nth-of-type(3):before { content: "Status"; }
    td:nth-of-type(4):before { content: "Distance"; }
  }
}

</style>