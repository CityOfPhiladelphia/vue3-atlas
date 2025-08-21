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

import VerticalTable from '@/components/VerticalTable.vue';

const loadingData = computed(() => CityServicesStore.loadingData );

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
  if (CityServicesStore.esCatchments && CityServicesStore.esCatchments.features) {
    catchment = CityServicesStore.esCatchments.features.find(catchment => {
      if (catchment.properties.es_name && geocodeElementarySchool.value) {
        return catchment.properties.es_name == geocodeElementarySchool.value;
      } else {
        return false;
      }
    });
  }
  return catchment;
});

const msCatchment = computed(() => {
  let catchment = {};
  if (CityServicesStore.msCatchments && CityServicesStore.msCatchments.features) {
    catchment = CityServicesStore.msCatchments.features.find(catchment => {
      if (catchment.properties.ms_name && geocodeMiddleSchool.value) {
        return catchment.properties.ms_name == geocodeMiddleSchool.value;
      } else {
        return false;
      }
    });
  }
  return catchment;
});

const hsCatchment = computed(() => {
  let catchment = {};
  if (CityServicesStore.hsCatchments && CityServicesStore.hsCatchments.features) {
    catchment = CityServicesStore.hsCatchments.features.find(catchment => {
      if (catchment.properties.hs_name && geocodeHighSchool.value) {
        return catchment.properties.hs_name == geocodeHighSchool.value;
      } else {
        return false;
      }
    });
  }
  return catchment;
});

const elementarySchool = computed(() => {
  let school = {};
  if (CityServicesStore.allSchools && CityServicesStore.allSchools.features && esCatchment.value && esCatchment.value.properties) {
    // if (import.meta.env.VITE_DEBUG) console.log('inside if');
    school = CityServicesStore.allSchools.features.find(school => {
      if (school.properties.location_id) {
        return school.properties.location_id == esCatchment.value.properties.es_id.toString();
      } else {
        return false;
      }
    });
  }
  return school;
});

watch(
  () => elementarySchool.value, (newElementarySchool) => {
    // if (import.meta.env.VITE_DEBUG) console.log('watch ElementarySchool.value:', newElementarySchool);
    if (newElementarySchool && newElementarySchool.properties) {
      CityServicesStore.elementarySchool = newElementarySchool;
    }
  }, { immediate: true }
);

const middleSchool = computed(() => {
  let school = null;
  if (CityServicesStore.allSchools && CityServicesStore.allSchools.features && msCatchment.value && msCatchment.value.properties) {
    school = CityServicesStore.allSchools.features.find(school => {
      if (school.properties.location_id) {
        return school.properties.location_id == msCatchment.value.properties.ms_id.toString();
      } else {
        return false;
      }
    });
  }
  return school;
});

watch(
  () => middleSchool.value, (newMiddleSchool) => {
    // if (import.meta.env.VITE_DEBUG) console.log('watch middleSchool.value:', newMiddleSchool);
    if (newMiddleSchool && newMiddleSchool.properties) {
      CityServicesStore.middleSchool = newMiddleSchool;
    }
  }, { immediate: true }
);

const highSchool = computed(() => {
  let school = null;
  if (CityServicesStore.allSchools && CityServicesStore.allSchools.features && hsCatchment.value && hsCatchment.value.properties) {
    school = CityServicesStore.allSchools.features.find(school => {
      if (school.properties.location_id && hsCatchment.value && hsCatchment.value.properties) {
        return school.properties.location_id == hsCatchment.value.properties.hs_id.toString();
      } else {
        return false;
      }
    });
  }
  return school;
});

watch(
  () => highSchool.value, (newHighSchool) => {
    // if (import.meta.env.VITE_DEBUG) console.log('watch highSchool.value:', newHighSchool);
    if (newHighSchool && newHighSchool.properties) {
      CityServicesStore.highSchool = newHighSchool;
    }
  }, { immediate: true }
);

const elementarySchoolData = computed(() => {
  if (elementarySchool.value && elementarySchool.value.properties) {
    return '<b>' + elementarySchool.value.properties.school_name_label + '</b><br>' + elementarySchool.value.properties.street_address + '<br>Philadelphia, PA ' + elementarySchool.value.properties.zip_code + '<br>' + elementarySchool.value.properties.phone_number + '<br>Grades: ' + elementarySchool.value.properties.grade_org;
  }
  return '';
});

const middleSchoolData = computed(() => {
  if (middleSchool.value && middleSchool.value.properties) {
    return '<b>' + middleSchool.value.properties.school_name_label + '</b><br>' + middleSchool.value.properties.street_address + '<br>Philadelphia, PA ' + middleSchool.value.properties.zip_code + '<br>' + middleSchool.value.properties.phone_number + '<br>Grades: ' + middleSchool.value.properties.grade_org;
  }
  return '';
});

const highSchoolData = computed(() => {
  if (highSchool.value && highSchool.value.properties) {
    return '<b>' + highSchool.value.properties.school_name_label + '</b><br>' + highSchool.value.properties.street_address + '<br>Philadelphia, PA ' + highSchool.value.properties.zip_code + '<br>' + highSchool.value.properties.phone_number + '<br>Grades: ' + highSchool.value.properties.grade_org;
  }
  return '';
});

const schoolsVertTableData = computed(() => {
  if (elementarySchool.value && elementarySchool.value.properties && middleSchool.value && middleSchool.value.properties && highSchool.value && highSchool.value.properties) {
    if (geocodeElementarySchool.value == geocodeMiddleSchool.value) {
      return [
        {
          label: 'Elementary & Middle School',
          value: elementarySchoolData.value,
          class: elementarySchool.value.properties.school_num,
        },
        {
          label: 'High School',
          value: highSchoolData.value,
          class: highSchool.value.properties.school_num,
        },
      ];
    } else if (geocodeMiddleSchool.value == geocodeHighSchool.value) {
      return [
        {
          label: 'Elementary & Middle School',
          value: elementarySchoolData.value,
          class: elementarySchool.value.properties.school_num,
        },
        {
          label: 'High School',
          value: highSchoolData.value,
          class: highSchool.value.properties.school_num,
        },
      ];
    } else if (geocodeElementarySchool.value == geocodeMiddleSchool.value == geocodeHighSchool.value) {
      return [
        {
          label: 'Elementary, Middle, and High School',
          value: elementarySchoolData.value,
          class: elementarySchool.value.properties.school_num,
        },
      ];
    } else {
      return [
        {
          label: 'Elementary School',
          value: elementarySchoolData.value,
          class: elementarySchool.value.properties.school_num,
        },
        {
          label: 'Middle School',
          value: middleSchoolData.value,
          class: middleSchool.value.properties.school_num,
        },
        {
          label: 'High School',
          value: highSchoolData.value,
          class: highSchool.value.properties.school_num,
        },
      ];
    }
  }
  return '';
});

const nearbySchools = computed(() => {
  return CityServicesStore.nearbySchools;
})

const nearbySchoolsGeojson = computed(() => {
  if (!nearbySchools.value) return null;
  return nearbySchools.value.map(item => point(item.geometry.coordinates, { id: item.id, type: 'nearbySchools' }));
})

watch(() => nearbySchoolsGeojson.value, (newGeojson) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('watch nearbySchoolsGeojson.value, newGeojson:', newGeojson);
  const map = MapStore.map;
  const feat = featureCollection(newGeojson);
  if (map.getSource) map.getSource('cityServices').setData(feat);
  const bounds = bbox(buffer(feat, 2000, {units: 'feet'}));
  map.fitBounds(bounds);
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
        field: 'properties.grade_org',
      },
      {
        label: 'Distance',
        field: 'properties.distance_mi',
      },
    ],
    rows: nearbySchools.value || [],
  }
});

const handleCellClick = (e) => {
  // if (import.meta.env.VITE_DEBUG) console.log('handleCellClick is running, e:', e);
  const map = MapStore.map;
  let lngLat, schoolName;
  if (e.includes('Elementary')) {
    lngLat = elementarySchool.value.geometry.coordinates;
    schoolName = elementarySchool.value.properties.school_name_label;
  } else if (e.includes('Middle')) {
    lngLat = middleSchool.value.geometry.coordinates;
    schoolName = middleSchool.value.properties.school_name_label;
  } else if (e.includes('High')) {
    lngLat = highSchool.value.geometry.coordinates;
    schoolName = highSchool.value.properties.school_name_label;
  }
  map.flyTo({ center: lngLat });
  const popup = document.getElementsByClassName('maplibregl-popup');
  if (popup.length) {
    popup[0].remove();
  }
  new maplibregl.Popup({ className: 'my-class', offset: 25 })
    .setLngLat(lngLat)
    .setHTML(schoolName)
    .setMaxWidth("300px")
    .addTo(map);
};

const handleCellMouseover = (e) => {
  // if (import.meta.env.VITE_DEBUG) console.log('handleCellMouseover is running, e:', e);
  MainStore.hoveredSchoolId = e.toString();
};

const handleCellMouseleave = () => {
  // if (import.meta.env.VITE_DEBUG) console.log('handleCellMouseleave is running, e:', e);
  MainStore.hoveredSchoolId = null;
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
    const feat = featureCollection([CityServicesStore.elementarySchool, CityServicesStore.middleSchool, CityServicesStore.highSchool]);
    map.getSource('schoolMarkers').setData(feat);
  }
})

</script>

<template>
  <div class="mt-5">
    <h2 class="subtitle mb-3 is-5">
      Designated Neighborhood Schools
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
      Nearby Public Schools
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
    :sort-options="{ initialSortBy: {field: 'properties.distance_mi', type: 'asc'}}"
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
      <div v-else-if="CityServicesStore.dataError">
        Data loading error - try refreshing the page
      </div>
      <div v-else>
        No nearby schools found
      </div>
    </template>
  </vue-good-table>
</template>

<style>

/* @media
only screen and (max-width: 768px) {

  #nearbyVacantIndicators {
    td:nth-of-type(2) { min-height: 60px; }

    td:nth-of-type(1):before { content: "Address"; }
    td:nth-of-type(2):before { content: "Property Type"; }
    td:nth-of-type(3):before { content: "Distance"; }
  }
} */

</style>
