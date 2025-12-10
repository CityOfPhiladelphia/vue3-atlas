<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { polygon, featureCollection } from '@turf/helpers';

import CustomPaginationLabels from '@/components/pagination/CustomPaginationLabels.vue';
import useTables from '@/composables/useTables';
const { paginationOptions } = useTables();

import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();
import { useLiStore } from '@/stores/LiStore';
const LiStore = useLiStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();

import VerticalTable from '../VerticalTable.vue';

import useTransforms from '@/composables/useTransforms';
const { prettyNumber } = useTransforms();

onMounted(async () => {
  if (LiStore.liBuildingFootprints.features) {
    await setLiBuildingFootprints(LiStore.liBuildingFootprints);
  }
});

// BUILDING FOOTPRINTS
const liBuildingFootprints = computed(() => LiStore.liBuildingFootprints);
const liBuildingFootprintsLength = computed(() => {
  if (LiStore.liBuildingFootprints.features){
    return LiStore.liBuildingFootprints.features.length;
  } else {
    return 0;
  }
});

watch (liBuildingFootprints,
  async (newLiBuildingFootprints) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('watch newLiBuildingFootprints.features:', newLiBuildingFootprints.features);
    const map = MapStore.map;
    await map.getSource('liBuildingFootprints').setData(featureCollection([]));
    if (newLiBuildingFootprints.features) {
      setLiBuildingFootprints(newLiBuildingFootprints);
    }
  }
)

const setLiBuildingFootprints = async(footprints) => {
  if (!footprints.features.length) return;
  LiStore.selectedLiBuildingNumber = footprints.features[0].attributes.bin;

  let features = [];
  for (let item of footprints.features) {
    features.push(polygon([item.geometry.rings[0]], { id: item.attributes.bin, type: 'liBuildingFootprints' }));
  }
  let geojson = featureCollection(features);
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('geojson:', geojson, 'map.getSource("liBuildingFootprints"):', map.getSource('liBuildingFootprints'), 'map.getLayer("liBuildingFootprints"):', map.getLayer('liBuildingFootprints'));
  const map = MapStore.map;
  if (map.getSource) {
    await map.getSource('liBuildingFootprints').setData(geojson)
  }
};

const selectedLiBuildingNumber = computed(() => LiStore.selectedLiBuildingNumber);
const selectedLiBuilding = computed(() => {
  if (!LiStore.liBuildingFootprints.features) return;
  return LiStore.liBuildingFootprints.features.filter(feature => feature.attributes.bin === selectedLiBuildingNumber.value)[0];
});

const handleBinClick = (bin) => {
  LiStore.selectedLiBuildingNumber = bin;
};

// BUILDING CERTIFICATIONS
const buildingCertsCompareFn = (a, b) => new Date(b.expirationdate) - new Date(a.expirationdate);
const selectedBuildingCerts = computed(() => {
  if (!LiStore.liBuildingCerts.rows || !selectedLiBuildingNumber.value) return [];
  return LiStore.liBuildingCerts.rows.filter(building => building.bin == selectedLiBuildingNumber.value).sort(buildingCertsCompareFn);
});

// PERMITS
const permitsCompareFn = (a, b) => new Date(b.permitissuedate) - new Date(a.permitissuedate);
const permits = computed(() => { if (LiStore.liPermits.rows) return [ ...LiStore.liPermits.rows ].sort(permitsCompareFn) });
const permitsLength = computed(() => permits.value && permits.value.length ? permits.value.length : 0);

// ZONING DOCS
const liZoningDocsCompareFn = (a, b) => new Date(b.scan_date || a.issue_date) - new Date(a.scan_date || a.issue_date);
const liAisZoningDocs = computed(() => LiStore.liAisZoningDocs.rows);
const liEclipseZoningDocs = computed(() => LiStore.liEclipseZoningDocs.rows);
const liAllZoningDocs = computed(() => {
  if (!liAisZoningDocs.value || !liEclipseZoningDocs.value) return [];
  return liAisZoningDocs.value.concat(liEclipseZoningDocs.value).sort(liZoningDocsCompareFn);
});

// INSPECTIONS
const inspectionsCompareFn = (a, b) => new Date(b.investigationcompleted) - new Date(a.investigationcompleted);
const inspections = computed(() => { if (LiStore.liInspections.rows) return [ ...LiStore.liInspections.rows ].sort(inspectionsCompareFn) });
const inspectionsLength = computed(() => inspections.value && inspections.value.length ? inspections.value.length : 0);

// VIOLATIONS
const violationsCompareFn = (a, b) => new Date(b.casecreateddate) - new Date(a.casecreateddate);
const violations = computed(() => { if (LiStore.liViolations.rows) return [ ...LiStore.liViolations.rows ].sort(violationsCompareFn) });
const violationsLength = computed(() => violations.value && violations.value.length ? violations.value.length : 0);

// BUSINESS LICENSES
const businessLicensesCompareFn = (a, b) => new Date(b.initialissuedate) - new Date(a.initialissuedate);
const businessLicenses = computed(() => { if (LiStore.liBusinessLicenses.rows) return [ ...LiStore.liBusinessLicenses.rows ].sort(businessLicensesCompareFn) });
const businessLicensesLength = computed(() => businessLicenses.value && businessLicenses.value.length ? businessLicenses.value.length : 0);

// L&I Appeals
const liAppealsCompareFn = (a, b) => new Date(b.createddate) - new Date(a.createddate);
const liAppeals = computed(() => { if (LiStore.liAppeals.rows) return [ ...LiStore.liAppeals.rows ].sort(liAppealsCompareFn) });
const liAppealsLength = computed(() => liAppeals.value && liAppeals.value.length ? liAppeals.value.length : 0);

// TABLES

const buildingData = computed(() => {
  const selectedLiBuilding = LiStore.liBuildingFootprints.features.filter(feature => feature.attributes.bin === selectedLiBuildingNumber.value)[0];
  return [
    {
      label: 'Building ID',
      value: selectedLiBuilding.attributes.bin || 'N/A',
    },
    {
      label: 'Building Name',
      value: selectedLiBuilding.attributes.building_name || 'N/A',
    },
    {
      label: 'Parcel Address',
      value: selectedLiBuilding.attributes.address || 'N/A',
    },
    {
      label: 'Building Height (approx)',
      value: selectedLiBuilding.attributes.approx_hgt + ' ft' || 'N/A',
    },
    {
      label: 'Building Footprint (approx)',
      value: prettyNumber(Math.round(selectedLiBuilding.attributes.Shape__Area * 6.3225)) + ' sq ft' || 'N/A',
    },
  ];
});

const buildingCertsTableData = ref({
  columns: [
    {
      label: 'Inspection Type',
      field: 'link',
      html: true,
    },
    {
      label: 'Date Inspected',
      field: 'inspectiondate',
      type: 'date',
      dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
      dateOutputFormat: 'MM/dd/yyyy',
    },
    {
      label: 'Inspection Result',
      field: 'inspectionresult',
    },
    {
      label: 'Expiration Date',
      field: 'expirationdate',
      type: 'date',
      dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
      dateOutputFormat: 'MM/dd/yyyy',
    }
  ],
  rows: selectedBuildingCerts.value || [],
})

const permitsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'permitissuedate',
        type: 'date',
        dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'ID',
        field: 'link',
        html: true,
      },
      {
        label: 'Description',
        field: 'permitdescription',
      },
      {
        label: 'Status',
        field: 'status',
      }
    ],
    rows: permits.value || [],
  }
});

const zoningDocsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'doc_date',
        type: 'date',
        dateInputFormat: 'MM/dd/yyyy',
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'Permit Number',
        field: 'permit_number',
      },
      {
        label: '# Pages',
        field: 'pages',
      },
      {
        label: 'ID',
        field: 'link',
        html: true,
      }
    ],
    rows: liAllZoningDocs.value || [],
  }
});

const inspectionsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'investigationcompleted',
        type: 'date',
        dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'ID',
        field: 'link',
        html: true,
      },
      {
        label: 'Description',
        field: 'description',
      },
      {
        label: 'Status',
        field: 'investigationstatus',
      }
    ],
    rows: inspections.value || [],
  }
});

const violationsTableData = computed(() => {
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
        label: 'ID',
        field: 'link',
        html: true,
      },
      {
        label: 'Description',
        // field: 'violationcodetitle',
        field: 'novLink',
        html: true,
      },
      {
        label: 'Status',
        field: 'violationstatus',
      }
    ],
    rows: violations.value || [],
  }
});

const businessLicensesTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'initialissuedate',
        type: 'date',
        dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
        dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'License Number',
        field: 'link',
        html: true,
      },
      {
        label: 'Name',
        field: 'business_name',
      },
      {
        label: 'Type',
        field: 'licensetype',
      },
      {
        label: 'Status',
        field: 'licensestatus',
      }
    ],
    rows: businessLicenses.value || [],
  }
});

const liAppealsTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Date',
        field: 'calendarlink',
        html: true,
        // type: 'date',
        // dateInputFormat: "yyyy-MM-dd'T'HH:mm:ssX",
        // dateOutputFormat: 'MM/dd/yyyy',
      },
      {
        label: 'Appeal Number',
        field: 'appeallink',
        html: true,
      },
      {
        label: 'Appeal Grounds',
        field: 'appealgrounds',
      },
      {
        label: 'Type',
        field: 'appealtype',
      },
      {
        label: 'Status',
        field: 'appealstatus',
      }
    ],
    rows: liAppeals.value || [],
  }
});

</script>

<template>
  <section>
    <div
      id="Licenses & Inspections-description"
      class="topic-info"
    >
      Licenses, inspections, permits, property maintenance violations, and zoning permit documents at your search address. Source: Department of Licenses & Inspections
    </div>

    <div class="summary mb-5">
      <span v-if="!LiStore.loadingLiBuildingFootprints">There {{ liBuildingFootprintsLength > 1 || liBuildingFootprintsLength == 0 ? 'are' : 'is' }} {{ liBuildingFootprintsLength }} {{ liBuildingFootprintsLength > 1 || liBuildingFootprintsLength == 0 ? 'buildings' : 'building' }} at this address</span>
      <span v-if="LiStore.loadingLiBuildingFootprints">Loading buildings </span>
      <font-awesome-icon
        v-if="LiStore.loadingLiBuildingFootprints"
        icon="fa-solid fa-spinner"
        spin
      />
    </div>
    <!-- Li Building Footprints Section -->
    <div
      v-if="selectedLiBuilding"
      id="li-building-div"
      class="columns add-borders p-2"
    >
      <div class="column is-12">
        <div v-if="selectedLiBuilding">
          <div class="columns is-multiline is-mobile">
            <button
              v-for="footprint in LiStore.liBuildingFootprints.features"
              :key="footprint.attributes.bin"
              class="li-building-select column is-2-desktop is-3-mobile has-text-centered add-borders pl-1 pr-1"
              :class="{ 'is-selected': footprint.attributes.bin === selectedLiBuildingNumber }"
              @click="handleBinClick(footprint.attributes.bin)"
            >
              {{ footprint.attributes.bin }}
            </button>
          </div>

          <!-- Li Building info-->
          <vertical-table
            table-id="buildingTable"
            :data="buildingData"
          />
          <br>

          <!-- Building Certs Table -->
          <h2 class="subtitle mb-3 is-5 table-title">
            Building Certifications
            <font-awesome-icon
              v-if="LiStore.loadingLiBuildingCerts"
              icon="fa-solid fa-spinner"
              spin
            />
            <span v-else>({{ buildingCertsTableData.rows.length }})</span>
          </h2>
          <p class="title-addition">
            Selected Building
          </p>
          <div
            v-if="selectedBuildingCerts"
            class="horizontal-table"
          >
            <vue-good-table
              id="building-certs"
              :columns="buildingCertsTableData.columns"
              :rows="buildingCertsTableData.rows"
              :pagination-options="paginationOptions(buildingCertsTableData.rows.length)"
              style-class="table"
            >
              <template #emptystate>
                <div v-if="LiStore.loadingLiBuildingCerts">
                  Loading building certifications... <font-awesome-icon
                    icon="fa-solid fa-spinner"
                    spin
                  />
                </div>
                <div v-else>
                  No building certifications found for the selected building
                </div>
              </template>
              <template #pagination-top="props">
                <custom-pagination-labels
                  :mode="'pages'"
                  :total="props.total"
                  :per-page="5"
                  @page-changed="props.pageChanged"
                  @per-page-changed="props.perPageChanged"
                />
              </template>
            </vue-good-table>
          </div>
          <div
            v-if="selectedBuildingCerts"
            class="table-link"
          >
            <a
              target="_blank"
              :href="`https://li.phila.gov/Property-History/search?address=${encodeURIComponent(MainStore.currentAddress)}`"
            >See all building certifications for this property at L&I Property History <font-awesome-icon icon="fa-solid fa-external-link" /></a>
          </div>
        </div>
      </div>
    </div>

    <!-- Li Permits Table -->
    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 table-title">
        Permits
        <font-awesome-icon
          v-if="LiStore.loadingLiPermits"
          icon="fa-solid fa-spinner"
          spin
        />
        <span v-else>({{ permitsLength }})</span>
      </h2>
      <div
        v-if="permitsTableData.rows"
        class="horizontal-table"
      >
        <vue-good-table
          id="permits"
          :columns="permitsTableData.columns"
          :rows="permitsTableData.rows"
          :pagination-options="paginationOptions(permitsTableData.rows.length)"
          style-class="table"
        >
          <template #emptystate>
            <div v-if="LiStore.loadingLiPermits">
              Loading permits... <font-awesome-icon
                icon="fa-solid fa-spinner"
                spin
              />
            </div>
            <div v-else>
              No permits found
            </div>
          </template>
          <template #pagination-top="props">
            <custom-pagination-labels
              :mode="'pages'"
              :total="props.total"
              :per-page="5"
              @page-changed="props.pageChanged"
              @per-page-changed="props.perPageChanged"
            />
          </template>
        </vue-good-table>
      </div>
      <a
        class="table-link"
        target="_blank"
        :href="`https://li.phila.gov/Property-History/search?address=${encodeURIComponent(MainStore.currentAddress)}`"
      >See all permits at L&I Property History <font-awesome-icon icon="fa-solid fa-external-link" /></a>
    </div>

    <!-- liAisZoningDocs and liEclipseZoningDocs Table-->
    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 table-title">
        Zoning Permit Documents
        <font-awesome-icon
          v-if="LiStore.loadingLiAisZoningDocs || LiStore.loadingLiEclipseZoningDocs"
          icon="fa-solid fa-spinner"
          spin
        />
        <span v-else>({{ zoningDocsTableData.rows.length }})</span>
      </h2>
      <p class="title-addition">
        formerly "Zoning Archive"
      </p>
      <div
        v-if="zoningDocsTableData.rows"
        class="horizontal-table"
      >
        <vue-good-table
          id="zoning-permit-docs"
          :columns="zoningDocsTableData.columns"
          :rows="zoningDocsTableData.rows"
          style-class="table"
          :pagination-options="paginationOptions(zoningDocsTableData.rows.length)"
        >
          <template #emptystate>
            <div v-if="LiStore.loadingLiAisZoningDocs || LiStore.loadingLiEclipseZoningDocs">
              Loading zoning permit documents... <font-awesome-icon
                icon="fa-solid fa-spinner"
                spin
              />
            </div>
            <div v-else>
              No zoning permit documents found
            </div>
          </template>
          <template #pagination-top="props">
            <custom-pagination-labels
              :mode="'pages'"
              :total="props.total"
              :per-page="5"
              @page-changed="props.pageChanged"
              @per-page-changed="props.perPageChanged"
            />
          </template>
        </vue-good-table>
      </div>
    </div>

    <!-- Li Inspections Table -->
    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 table-title">
        Inspections
        <font-awesome-icon
          v-if="LiStore.loadingLiInspections"
          icon="fa-solid fa-spinner"
          spin
        />
        <span v-else>({{ inspectionsLength }})</span>
      </h2>
      <div
        v-if="inspectionsTableData.rows"
        class="horizontal-table"
      >
        <vue-good-table
          id="inspections"
          :columns="inspectionsTableData.columns"
          :rows="inspectionsTableData.rows"
          :pagination-options="paginationOptions(inspectionsTableData.rows.length)"
          style-class="table"
        >
          <template #emptystate>
            <div v-if="LiStore.loadingLiInspections">
              Loading inspections... <font-awesome-icon
                icon="fa-solid fa-spinner"
                spin
              />
            </div>
            <div v-else>
              No inspections found
            </div>
          </template>
          <template #pagination-top="props">
            <custom-pagination-labels
              :mode="'pages'"
              :total="props.total"
              :per-page="5"
              @page-changed="props.pageChanged"
              @per-page-changed="props.perPageChanged"
            />
          </template>
        </vue-good-table>
      </div>
      <a
        class="table-link"
        target="_blank"
        :href="`https://li.phila.gov/Property-History/search?address=${encodeURIComponent(MainStore.currentAddress)}`"
      >See all inspections at L&I Property History <font-awesome-icon icon="fa-solid fa-external-link" /></a>
    </div>

    <!-- Li Violations Table -->
    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 table-title">
        Violations
        <font-awesome-icon
          v-if="LiStore.loadingLiViolations"
          icon="fa-solid fa-spinner"
          spin
        />
        <span v-else>({{ violationsLength }})</span>
      </h2>
      <div
        v-if="violationsTableData.rows"
        class="horizontal-table"
      >
        <vue-good-table
          id="violations"
          :columns="violationsTableData.columns"
          :rows="violationsTableData.rows"
          :pagination-options="paginationOptions(violationsTableData.rows.length)"
          style-class="table"
        >
          <template #emptystate>
            <div v-if="LiStore.loadingLiViolations">
              Loading violations... <font-awesome-icon
                icon="fa-solid fa-spinner"
                spin
              />
            </div>
            <div v-else>
              No violations found
            </div>
          </template>
          <template #pagination-top="props">
            <custom-pagination-labels
              :mode="'pages'"
              :total="props.total"
              :per-page="5"
              @page-changed="props.pageChanged"
              @per-page-changed="props.perPageChanged"
            />
          </template>
        </vue-good-table>
      </div>
      <a
        class="table-link"
        target="_blank"
        :href="`https://li.phila.gov/Property-History/search?address=${encodeURIComponent(MainStore.currentAddress)}`"
      >See all violations at L&I Property History <font-awesome-icon icon="fa-solid fa-external-link" /></a>
    </div>

    <!-- L&I Appeals Table -->
    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 table-title">
        L&I Appeals
        <font-awesome-icon
          v-if="LiStore.loadingLiAppeals"
          icon="fa-solid fa-spinner"
          spin
        />
        <span v-else>({{ liAppealsLength }})</span>
      </h2>
      <div
        v-if="liAppealsTableData"
        class="horizontal-table"
      >
        <vue-good-table
          id="li-appeals"
          :columns="liAppealsTableData.columns"
          :rows="liAppealsTableData.rows"
          :pagination-options="paginationOptions(liAppealsTableData.rows.length)"
          style-class="table"
        >
          <template #emptystate>
            <div v-if="LiStore.loadingLiAppeals">
              Loading L&I appeals... <font-awesome-icon
                icon="fa-solid fa-spinner"
                spin
              />
            </div>
            <div v-else>
              No L&I appeals found
            </div>
          </template>
          <template #pagination-top="props">
            <custom-pagination-labels
              :mode="'pages'"
              :total="props.total"
              :per-page="5"
              @page-changed="props.pageChanged"
              @per-page-changed="props.perPageChanged"
            />
          </template>
        </vue-good-table>
      </div>
      <a
        class="table-link"
        target="_blank"
        :href="`https://li.phila.gov/Property-History/search?address=${encodeURIComponent(MainStore.currentAddress)}`"
      >See all appeals at L&I Property History <font-awesome-icon icon="fa-solid fa-external-link" /></a>
    </div>

    <!-- Li Business Licenses Table -->
    <div class="data-section">
      <h2 class="subtitle mb-3 is-5 table-title">
        Business Licenses
        <font-awesome-icon
          v-if="LiStore.loadingLiBusinessLicenses"
          icon="fa-solid fa-spinner"
          spin
        />
        <span v-else>({{ businessLicensesLength }})</span>
      </h2>
      <div
        v-if="businessLicensesTableData"
        class="horizontal-table"
      >
        <vue-good-table
          id="business-licenses"
          :columns="businessLicensesTableData.columns"
          :rows="businessLicensesTableData.rows"
          :pagination-options="paginationOptions(businessLicensesTableData.rows.length)"
          style-class="table"
        >
          <template #emptystate>
            <div v-if="LiStore.loadingLiBusinessLicenses">
              Loading business licenses... <font-awesome-icon
                icon="fa-solid fa-spinner"
                spin
              />
            </div>
            <div v-else>
              No business licenses found
            </div>
          </template>
          <template #pagination-top="props">
            <custom-pagination-labels
              :mode="'pages'"
              :total="props.total"
              :per-page="5"
              @page-changed="props.pageChanged"
              @per-page-changed="props.perPageChanged"
            />
          </template>
        </vue-good-table>
      </div>
      <a
        class="table-link"
        target="_blank"
        :href="`https://li.phila.gov/Property-History/search?address=${encodeURIComponent(MainStore.currentAddress)}`"
      >See all business licenses at L&I Property History <font-awesome-icon icon="fa-solid fa-external-link" /></a>
    </div>
  </section>
</template>

<style>

.summary {
  font-weight: bold;
}

.li-building-select {
  color: #444444;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
}

.li-building-select:hover {
  background-color: #f0f0f0;
}

#li-building-div {
  padding: 0px !important;
  margin-bottom: 1.5rem;
}

.title-addition {
  font-family: 'Montserrat';
  font-size: .95rem
}

@media
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {

  td[colspan="4"] {
    padding-left: 0px !important;
  }

	/* Label the data */

	#building-certs {

    td {
      min-height: 60px;
    }

    td:nth-of-type(1):before { content: "Inspection Type"; }
    td:nth-of-type(2):before { content: "Date Inspected"; }
    td:nth-of-type(3):before { content: "Inspection Result"; }
    td:nth-of-type(4):before { content: "Expiration Date"; }
  }

  #permits, #inspections, #violations {

    /* td:nth-of-type(1):before { content: "Date"; }} */
    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "ID"; }
    td:nth-of-type(3):before { content: "Description"; }
    td:nth-of-type(4):before { content: "Status"; }
  }

  #zoning-permit-docs {
    /* margin-bottom: 2rem; */

    td:nth-of-type(2) {
      min-height: 60px;
    }

    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "Permit Number"; }
    td:nth-of-type(3):before { content: "# Pages"; }
    td:nth-of-type(4):before { content: "ID"; }
  }

  #business-licenses {
    td:nth-of-type(2) {
      min-height: 60px;
    }

    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "License Number"; }
    td:nth-of-type(3):before { content: "Name"; }
    td:nth-of-type(4):before { content: "Type"; }
    td:nth-of-type(5):before { content: "Status"; }
  }

  #li-appeals {
    td:nth-of-type(2) {
      min-height: 60px;
    }

    td:nth-of-type(1):before { content: "Date"; }
    td:nth-of-type(2):before { content: "Appeal Number"; }
    td:nth-of-type(3):before { content: "Appeal Grounds"; }
    td:nth-of-type(4):before { content: "Type"; }
    td:nth-of-type(5):before { content: "Status"; }
  }

}



</style>
