<script setup>

import { computed } from 'vue';

import { useGeocodeStore } from '@/stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();
import { useNearbyFacilitiesStore } from '@/stores/NearbyFacilitiesStore';
const NearbyFacilitiesStore = useNearbyFacilitiesStore();

import VerticalTable from '@/components/VerticalTable.vue';

const loadingData = computed(() => NearbyFacilitiesStore.loadingData );

const geocodeElementarySchool = computed(() => {
  let value = null;
  if (GeocodeStore.aisData.features) {
    value = GeocodeStore.aisData.features[0].properties.elementary_school.split(',')[0];
  }
  return value;
});
const geocodeMiddleSchool = computed(() => {
  let value = null;
  if (GeocodeStore.aisData.features) {
    value = GeocodeStore.aisData.features[0].properties.middle_school.split(',')[0];
  }
  return value;
});
const geocodeHighSchool = computed(() => {
  let value = null;
  if (GeocodeStore.aisData.features) {
    value = GeocodeStore.aisData.features[0].properties.high_school.split(',')[0];
  }
  return value;
});

const elementarySchool = computed(() => {
  let value = null;
  if (NearbyFacilitiesStore.allSchools && NearbyFacilitiesStore.allSchools.features) {
    value = NearbyFacilitiesStore.allSchools.features.find(school => {
      if (school.properties.SCHOOL_NAME && geocodeElementarySchool.value) {
        return school.properties.SCHOOL_NAME_LABEL.toLowerCase().includes(geocodeElementarySchool.value.toLowerCase())
      } else {
        return false;
      }
    });
  };
  return value;
});

const middleSchool = computed(() => {
  if (geocodeElementarySchool.value == geocodeMiddleSchool.value) {
    return elementarySchool.value;
  } else {
    let value = null;
    if (NearbyFacilitiesStore.allSchools && NearbyFacilitiesStore.allSchools.features) {
      value = NearbyFacilitiesStore.allSchools.features.find(school => {
        if (school.properties.SCHOOL_NAME && geocodeMiddleSchool.value) {
          console.log('geocodeMiddleSchool.value:', geocodeMiddleSchool.value.toLowerCase(), 'school.properties.SCHOOL_NAME_LABEL:', school.properties.SCHOOL_NAME_LABEL.toLowerCase());
          return school.properties.SCHOOL_NAME_LABEL.toLowerCase().includes(geocodeMiddleSchool.value.toLowerCase());
        } else {
          return false;
        }
      });
    };
    return value;
  };
});

const highSchool = computed(() => {
  let value = null;
  if (NearbyFacilitiesStore.allSchools && NearbyFacilitiesStore.allSchools.features) {
    value = NearbyFacilitiesStore.allSchools.features.find(school => {
      if (school.properties.SCHOOL_NAME && geocodeHighSchool.value) {
        return school.properties.SCHOOL_NAME_LABEL.toLowerCase().includes(geocodeHighSchool.value.toLowerCase())
      } else {
        return false;
      }
    });
  };
  return value;
});

const elementarySchoolData = computed(() => {
  if (elementarySchool.value) {
    return '<b>' + elementarySchool.value.properties.SCHOOL_NAME_LABEL + '</b><br>' + elementarySchool.value.properties.STREET_ADDRESS + '<br>Philadelphia, PA ' + elementarySchool.value.properties.ZIP_CODE + '<br>' + elementarySchool.value.properties.PHONE_NUMBER + '<br>' + elementarySchool.value.properties.GRADE_ORG;
  }
});

const middleSchoolData = computed(() => {
  if (middleSchool.value) {
    return '<b>' + middleSchool.value.properties.SCHOOL_NAME_LABEL + '</b><br>' + middleSchool.value.properties.STREET_ADDRESS + '<br>Philadelphia, PA ' + middleSchool.value.properties.ZIP_CODE + '<br>' + middleSchool.value.properties.PHONE_NUMBER + '<br>' + middleSchool.value.properties.GRADE_ORG;
  }
});

const highSchoolData = computed(() => {
  if (highSchool.value) {
    return '<b>' + highSchool.value.properties.SCHOOL_NAME_LABEL + '</b><br>' + highSchool.value.properties.STREET_ADDRESS + '<br>Philadelphia, PA ' + highSchool.value.properties.ZIP_CODE + '<br>' + highSchool.value.properties.PHONE_NUMBER + '<br>' + highSchool.value.properties.GRADE_ORG;
  }
});

const schoolsVertTableData = computed(() => {
  if (geocodeElementarySchool.value == geocodeMiddleSchool.value) {
    return [
      {
        label: 'Elementary & Middle School',
        value: elementarySchoolData.value,
      },
      {
        label: 'High School',
        value: highSchoolData.value,
      },
    ];
  } else {
    return [
      {
        label: 'Elementary School',
        value: elementarySchoolData.value,
      },
      {
        label: 'Middle School',
        value: middleSchoolData.value,
      },
      {
        label: 'High School',
        value: highSchoolData.value,
      },
    ];
  }
});

const nearbySchools = computed(() => {
  return NearbyFacilitiesStore.nearbySchools;
})

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

  <!-- :row-style-class="row => hoveredStateId === row.service_request_id ? 'active-hover ' + row.service_request_id : 'inactive ' + row.service_request_id" -->
  <vue-good-table
    id="nearbySchools"
    :columns="nearbySchoolsTableData.columns"
    :rows="nearbySchoolsTableData.rows"
    style-class="table nearby-table"
    :sort-options="{ initialSortBy: {field: 'properties.distance_ft', type: 'asc'}}"
  >
  <!-- @row-mouseenter="handleRowMouseover($event, 'service_request_id')"
  @row-mouseleave="handleRowMouseleave"
  @row-click="handleRowClick($event, 'service_request_id', 'nearby311')" -->
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