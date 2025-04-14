<script setup>

import { computed, watch } from 'vue';
import { point, featureCollection } from '@turf/helpers';

import { useGeocodeStore } from '@/stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();
import { useNearbyFacilitiesStore } from '@/stores/NearbyFacilitiesStore';
const NearbyFacilitiesStore = useNearbyFacilitiesStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();
import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();

import useScrolling from '@/composables/useScrolling';
const { handleRowClick, handleRowMouseover, handleRowMouseleave } = useScrolling();

import VerticalTable from '@/components/VerticalTable.vue';

const loadingData = computed(() => NearbyFacilitiesStore.loadingData );

const geocodeElementarySchool = computed(() => {
  let value = null;
  if (GeocodeStore.aisData.features) {
    value = GeocodeStore.aisData.features[0].properties.elementary_school;
  }
  return value;
});
const geocodeMiddleSchool = computed(() => {
  let value = null;
  if (GeocodeStore.aisData.features) {
    value = GeocodeStore.aisData.features[0].properties.middle_school;
  }
  return value;
});
const geocodeHighSchool = computed(() => {
  let value = null;
  if (GeocodeStore.aisData.features) {
    value = GeocodeStore.aisData.features[0].properties.high_school;
  }
  return value;
});

const esCatchment = computed(() => {
  let catchment = {};
  if (NearbyFacilitiesStore.esCatchments && NearbyFacilitiesStore.esCatchments.features) {
    catchment = NearbyFacilitiesStore.esCatchments.features.find(catchment => {
      if (catchment.properties.ES_NAME && geocodeElementarySchool.value) {
        return catchment.properties.ES_NAME == geocodeElementarySchool.value;
      } else {
        return false;
      }
    });
  };
  return catchment;
});

const msCatchment = computed(() => {
  let catchment = {};
  if (NearbyFacilitiesStore.msCatchments && NearbyFacilitiesStore.msCatchments.features) {
    catchment = NearbyFacilitiesStore.msCatchments.features.find(catchment => {
      if (catchment.properties.ES_NAME && geocodeElementarySchool.value) {
        return catchment.properties.ES_NAME == geocodeElementarySchool.value;
      } else {
        return false;
      }
    });
  };
  return catchment;
});

const hsCatchment = computed(() => {
  let catchment = {};
  if (NearbyFacilitiesStore.hsCatchments && NearbyFacilitiesStore.hsCatchments.features) {
    catchment = NearbyFacilitiesStore.hsCatchments.features.find(catchment => {
      if (catchment.properties.ES_NAME && geocodeElementarySchool.value) {
        return catchment.properties.ES_NAME == geocodeElementarySchool.value;
      } else {
        return false;
      }
    });
  };
  return catchment;
});

const elementarySchool = computed(() => {
  let school = {};
  if (NearbyFacilitiesStore.allSchools && NearbyFacilitiesStore.allSchools.features && esCatchment.value && esCatchment.value.properties) {
    if (import.meta.env.VITE_DEBUG) console.log('inside if');
    school = NearbyFacilitiesStore.allSchools.features.find(school => {
      if (school.properties.LOCATION_ID) {
        return school.properties.LOCATION_ID == esCatchment.value.properties.ES_ID.toString();
      } else {
        return false;
      }
    });
  };
  if (import.meta.env.VITE_DEBUG) console.log('school:', school);
  return school;
});

watch(() => elementarySchool.value, (newElementarySchool) => {
  // if (import.meta.env.VITE_DEBUG) console.log('watch ElementarySchool.value:', newElementarySchool);
  if (newElementarySchool && newElementarySchool.properties) {
    NearbyFacilitiesStore.elementarySchool = newElementarySchool;
  }
});

const middleSchool = computed(() => {
  let school = null;
  if (NearbyFacilitiesStore.allSchools && NearbyFacilitiesStore.allSchools.features && msCatchment.value && msCatchment.value.properties) {
    school = NearbyFacilitiesStore.allSchools.features.find(school => {
      if (school.properties.LOCATION_ID) {
        return school.properties.LOCATION_ID == msCatchment.value.properties.MS_ID.toString();
      } else {
        return false;
      }
    });
  };
  return school;
});

watch(() => middleSchool.value, (newMiddleSchool) => {
  // if (import.meta.env.VITE_DEBUG) console.log('watch middleSchool.value:', newMiddleSchool);
  if (newMiddleSchool && newMiddleSchool.properties) {
    NearbyFacilitiesStore.middleSchool = newMiddleSchool;
  }
});

const highSchool = computed(() => {
  let school = null;
  if (NearbyFacilitiesStore.allSchools && NearbyFacilitiesStore.allSchools.features && hsCatchment.value && hsCatchment.value.properties) {
    school = NearbyFacilitiesStore.allSchools.features.find(school => {
      if (school.properties.LOCATION_ID && hsCatchment.value && hsCatchment.value.properties) {
        return school.properties.LOCATION_ID == hsCatchment.value.properties.HS_ID.toString();
      } else {
        return false;
      }
    });
  };
  return school;
});

watch(() => highSchool.value, (newHighSchool) => {
  // if (import.meta.env.VITE_DEBUG) console.log('watch highSchool.value:', newHighSchool);
  if (newHighSchool && newHighSchool.properties) {
    NearbyFacilitiesStore.highSchool = newHighSchool;
  }
});

const elementarySchoolData = computed(() => {
  if (elementarySchool.value && elementarySchool.value.properties) {
    return '<b>' + elementarySchool.value.properties.SCHOOL_NAME_LABEL + '</b><br>' + elementarySchool.value.properties.STREET_ADDRESS + '<br>Philadelphia, PA ' + elementarySchool.value.properties.ZIP_CODE + '<br>' + elementarySchool.value.properties.PHONE_NUMBER + '<br>' + elementarySchool.value.properties.GRADE_ORG;
  }
});

const middleSchoolData = computed(() => {
  if (middleSchool.value && middleSchool.value.properties) {
    return '<b>' + middleSchool.value.properties.SCHOOL_NAME_LABEL + '</b><br>' + middleSchool.value.properties.STREET_ADDRESS + '<br>Philadelphia, PA ' + middleSchool.value.properties.ZIP_CODE + '<br>' + middleSchool.value.properties.PHONE_NUMBER + '<br>' + middleSchool.value.properties.GRADE_ORG;
  }
});

const highSchoolData = computed(() => {
  if (highSchool.value && highSchool.value.properties) {
    return '<b>' + highSchool.value.properties.SCHOOL_NAME_LABEL + '</b><br>' + highSchool.value.properties.STREET_ADDRESS + '<br>Philadelphia, PA ' + highSchool.value.properties.ZIP_CODE + '<br>' + highSchool.value.properties.PHONE_NUMBER + '<br>' + highSchool.value.properties.GRADE_ORG;
  }
});

const schoolsVertTableData = computed(() => {
  if (elementarySchool.value && elementarySchool.value.properties && middleSchool.value && middleSchool.value.properties && highSchool.value && highSchool.value.properties) {
    if (geocodeElementarySchool.value == geocodeMiddleSchool.value) {
      return [
        {
          label: 'Elementary & Middle School',
          value: elementarySchoolData.value,
          class: elementarySchool.value.properties.SCHOOL_NUM,
        },
        {
          label: 'High School',
          value: highSchoolData.value,
          class: highSchool.value.properties.SCHOOL_NUM,
        },
      ];
    } else {
      return [
        {
          label: 'Elementary School',
          value: elementarySchoolData.value,
          class: elementarySchool.value.properties.SCHOOL_NUM,
        },
        {
          label: 'Middle School',
          value: middleSchoolData.value,
          class: middleSchool.value.properties.SCHOOL_NUM,
        },
        {
          label: 'High School',
          value: highSchoolData.value,
          class: highSchool.value.properties.SCHOOL_NUM,
        },
      ];
    }
  }
});

const nearbySchools = computed(() => {
  return NearbyFacilitiesStore.nearbySchools;
})

const nearbySchoolsGeojson = computed(() => {
  if (!nearbySchools.value) return null;
  // nearbySchools.value.map(item => {
  //   // if (import.meta.env.VITE_DEBUG) console.log('item:', item);
  //   item.properties.id = item.properties.AUN;
  //   item.properties.type = 'nearbySchools';
  // });
  // if (import.meta.env.VITE_DEBUG) console.log('nearbySchoolsAdded:', nearbySchoolsAdded);
  
  return nearbySchools.value.map(item => point(item.geometry.coordinates, { id: item.id, type: 'nearbySchools' }));

})

watch (() => nearbySchoolsGeojson.value, (newGeojson) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('watch nearbySchoolsGeojson.value, newGeojson:', newGeojson);
  // if (!newGeojson) return;
  const map = MapStore.map;
  if (import.meta.env.VITE_DEBUG == 'true') console.log('watch, map:', map);
  if (map.getSource) map.getSource('nearbyFacilities').setData(featureCollection(newGeojson));
});

const hoveredStateId = computed(() => { return MainStore.hoveredStateId; });
const hoveredSchoolId = computed(() => { return MainStore.hoveredSchoolId; });

const nearbySchoolsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'School Name',
        field: 'properties.schoolInfo',
        html: true,
      },
      {
        label: 'Grades',
        field: 'properties.GRADE_ORG',
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
    rows: nearbySchools.value || [],
  }
});

const handleCellClick = (e) => {
  if (import.meta.env.VITE_DEBUG) console.log('handleCellClick is running, e:', e);
};

const handleCellMouseover = (e) => {
  if (import.meta.env.VITE_DEBUG) console.log('handleCellMouseover is running, e:', e);
  MainStore.hoveredSchoolId = e.toString();
};

const handleCellMouseleave = (e) => {
  if (import.meta.env.VITE_DEBUG) console.log('handleCellMouseleave is running, e:', e);
  MainStore.hoveredSchoolId = null;
};

</script>

<template>

  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Neighborhood Schools
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
    </h2>
  </div>

  <vertical-table
    table-id="assigned-schools"
    :data="schoolsVertTableData"
    :hovered-id="hoveredSchoolId"
    @clicked-cell="handleCellClick"
    @hovered-cell="handleCellMouseover"
    @unhovered-cell="handleCellMouseleave"
  />

  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Nearby Citywide, Special Admission, and Charter Schools
      <font-awesome-icon
        v-if="loadingData"
        icon="fa-solid fa-spinner"
        spin
      />
      <span v-else>({{ nearbySchoolsTableData.rows.length }})</span>
    </h2>
  </div>

  <vue-good-table
    id="nearbySchools"
    :columns="nearbySchoolsTableData.columns"
    :rows="nearbySchoolsTableData.rows"
    :row-style-class="row => hoveredStateId === row.id ? 'active-hover ' + row.id : 'inactive ' + row.id"
    style-class="table nearby-table"
    :sort-options="{ initialSortBy: {field: 'properties.distance_ft', type: 'asc'}}"
    @row-mouseenter="handleRowMouseover($event, 'id')"
    @row-mouseleave="handleRowMouseleave"
    @row-click="handleRowClick($event, 'id', 'nearbySchools')"
  >
    <template #emptystate>
      <div v-if="loadingData">
        Loading nearby schools... <font-awesome-icon
          icon="fa-solid fa-spinner"
          spin
        />
      </div>
      <div v-else-if="NearbyFacilitiesStore.dataError">
        Data loading error - try refreshing the page
      </div>
      <div v-else>
        No nearby schools found
      </div>
    </template>
  </vue-good-table>

</template>

<style>

@media 
only screen and (max-width: 768px) {

  #nearbyVacantIndicators {
    td:nth-of-type(2) { min-height: 60px; }

    /*Label the data*/
    td:nth-of-type(1):before { content: "Address"; }
    td:nth-of-type(2):before { content: "Property Type"; }
    td:nth-of-type(3):before { content: "Distance"; }
  }
}

</style>