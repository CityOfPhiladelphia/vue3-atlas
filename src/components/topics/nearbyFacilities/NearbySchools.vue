<script setup>

import { computed } from 'vue';

import { useGeocodeStore } from '@/stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();
import { useNearbyFacilitiesStore } from '@/stores/NearbyFacilitiesStore';
const NearbyFacilitiesStore = useNearbyFacilitiesStore();

import VerticalTable from '@/components/VerticalTable.vue';

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
        return school.properties.SCHOOL_NAME.toLowerCase().includes(geocodeElementarySchool.value.toLowerCase())
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
          return school.properties.SCHOOL_NAME.toLowerCase().includes(geocodeMiddleSchool.value.toLowerCase());
        } else {
          return false;
        }
      });
    };
  };
});

const highSchool = computed(() => {
  let value = null;
  if (NearbyFacilitiesStore.allSchools && NearbyFacilitiesStore.allSchools.features) {
    value = NearbyFacilitiesStore.allSchools.features.find(school => {
      if (school.properties.SCHOOL_NAME && geocodeHighSchool.value) {
        return school.properties.SCHOOL_NAME.toLowerCase().includes(geocodeHighSchool.value.toLowerCase())
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


</template>