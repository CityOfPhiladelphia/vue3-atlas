<script setup>

import { computed } from 'vue'

import { useGeocodeStore } from '@/stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();

import VerticalTable from '@/components/VerticalTable.vue';

const hasData = computed(() => {
  if (GeocodeStore.aisData.features && GeocodeStore.aisData.features.length > 0) {
    return true;
  } else {
    return false;
  }
})

const geocode = computed(() => {
  if (hasData.value) {
    return GeocodeStore.aisData.features[0].properties;
  } else {
    return null;
  }
})

const districtsVertTableData = computed(() => {
  if (hasData.value) {
    return [
      {
        label: 'Planning',
        value: geocode.value.planning_district,
      },
      {
        label: 'L+I',
        value: geocode.value.li_district,
      },
      {
        label: 'Census Tract (2010)',
        value: geocode.value.census_tract_2010,
      },
      {
        label: 'Census Block Group (2010)',
        value: geocode.value.census_block_group_2010,
      },
      {
        label: 'Commercial Corridor',
        value: geocode.value.commercial_corridor || 'n/a',
      },
      {
        label: 'Sanitation District',
        value: geocode.value.sanitation_district,
      },
      {
        label: 'Sanitation Convenience Center',
        value: geocode.value.sanitation_convenience_center,
      },
    ]
  } else {
    return []
  }
})

const publicSafetyVertTableData = computed(() => {
  if (hasData.value) {
    return [
      {
        label: 'Police District',
        value: geocode.value.police_district,
      },
      {
        label: 'Police Public Service Area',
        value: geocode.value.police_service_area,
      },
      {
        label: 'Police Division',
        value: geocode.value.police_division,
      },
    ]
  } else {
    return []
  }
})

const streetsVertTableData = computed(() => {
  if (hasData.value) {
    return [
      {
        label: 'Highway District',
        value: geocode.value.highway_district,
      },
      {
        label: 'Highway Section',
        value: geocode.value.highway_section,
      },
      {
        label: 'Highway Subsection',
        value: geocode.value.highway_subsection,
      },
      {
        label: 'Street Light Routes',
        value: geocode.value.street_light_route,
      },
      {
        label: 'Traffic District',
        value: geocode.value.traffic_district,
      },
      {
        label: 'Traffic PM District',
        value: geocode.value.traffic_pm_district,
      },
    ]
  } else {
    return []
  }
})

</script>

<template>
  <div
    id="Districts-description"
    class="topic-info"
  >
    Districts related to police, L&I, city planning, streets, census, and commerce for this address. Sources: Department of Streets, Licenses and Inspections, Planning and Development, & Philadelphia Police Dept.
  </div>
  <div v-if="!hasData">
    There is no district data available for this address.
  </div>
  <div v-if="hasData">
    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 vert-table-title">
        Districts
      </h2>
      <vertical-table
        table-id="districtsTable"
        :data="districtsVertTableData"
      />
    </div>
  
    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 vert-table-title">
        Public Safety
      </h2>
      <vertical-table
        table-id="publicSafetyTable"
        :data="publicSafetyVertTableData"
      />
    </div>
  
    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 vert-table-title">
        Streets
      </h2>
      <vertical-table
        table-id="streetsTable"
        :data="streetsVertTableData"
      />
    </div>
  </div>
</template>