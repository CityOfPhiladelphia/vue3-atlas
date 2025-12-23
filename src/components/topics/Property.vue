<script setup>

import { computed } from 'vue';

import CustomPaginationLabels from '@/components/pagination/CustomPaginationLabels.vue';
import useTables from '@/composables/useTables';
const { paginationOptions } = useTables();

import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();
import { useGeocodeStore } from '@/stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();
import { useOpaStore } from '@/stores/OpaStore';
const OpaStore = useOpaStore();
import { useCondosStore } from '@/stores/CondosStore';
const CondosStore = useCondosStore();

import useTransforms from '@/composables/useTransforms';
const { titleCase, currency } = useTransforms();

import VerticalTable from '@/components/VerticalTable.vue';

const atlasVertTableData = computed(() => {
  if(GeocodeStore.aisData.features && GeocodeStore.aisData.features.length || OpaStore.rows && OpaStore.rows.length) {
    return [
      {
        label: 'OPA Account #',
        value: GeocodeStore.aisData.features[0].properties.opa_account_num,
      },
      {
        label: 'OPA Address',
        value: GeocodeStore.aisData.features[0].properties.opa_address,
      },
      {
        label: 'Owners',
        value: GeocodeStore.aisData.features[0].properties.opa_owners,
      },
      {
        label: 'Assessed Value',
        value: OpaStore.getMarketValue,
      },
      {
        label: 'Sale Date',
        value: OpaStore.getSaleDate || 'none',
      },
      {
        label: 'Sale Price',
        value: OpaStore.getSalePrice,
      },
    ]
  } else {
    return []
  }
});

const mailingAddress = computed(() => {
  const mailing = [];
  if (!OpaStore.opaData.rows || !OpaStore.opaData.rows.length) return null;
  const opa = OpaStore.opaData.rows[0];
  opa.mailing_care_of != null && opa.mailing_care_of.length > 0 ? mailing.push(titleCase(opa.mailing_care_of) +'<br>'):null;
  opa.mailing_address_1 != null && opa.mailing_address_1.length > 0 ? mailing.push(titleCase(opa.mailing_address_1) +'<br>'):null;
  opa.mailing_address_2 != null && opa.mailing_address_2.length > 0 ? mailing.push(titleCase(opa.mailing_address_2) +'<br>'):null;
  if (import.meta.env.VITE_DEBUG == 'true') console.log(mailing);
  return opa.mailing_street != null && opa.mailing_street.length > 0 ?
    mailing.join('') + titleCase(opa.mailing_street) +
          '<br>'+ titleCase(opa.mailing_city_state).replace(/\w$/, c => c.toUpperCase()) +
          '<br>'+ opa.mailing_zip : titleCase(opa.location) +
          '<br> Philadelphia, PA '+ [ opa.zip_code.slice(0, 5), "-", opa.zip_code.slice(5) ].join('');

})

const cityatlasVertTable1Data = computed(() => {
  if(GeocodeStore.aisData.features && GeocodeStore.aisData.features.length || OpaStore.rows && OpaStore.rows.length) {
    return [
      {
        label: 'Owners',
        value: GeocodeStore.aisData.features[0].properties.opa_owners,
      },
      {
        label: 'OPA Address',
        value: GeocodeStore.aisData.features[0].properties.opa_address,
      },
      {
        label: 'Mailing Address',
        value: mailingAddress.value,
      },
    ]
  } else {
    return []
  }
});

const cityatlasVertTable2Data = computed(() => {
  if(GeocodeStore.aisData.features && GeocodeStore.aisData.features.length || OpaStore.rows && OpaStore.rows.length) {
    return [
      {
        label: 'OPA Account #',
        value: GeocodeStore.aisData.features[0].properties.opa_account_num,
      },
      {
        label: 'Homestead Exemption',
        value: currency(OpaStore.getHomesteadExemption),
      },
      {
        label: 'Description',
        value: OpaStore.getDescription,
      },
      {
        label: 'Condition',
        value: OpaStore.getCondition,
      },
      {
        label: 'Beginning Point',
        value: OpaStore.getBeginningPoint,
      },
      {
        label: 'Land Area',
        value: OpaStore.getLandArea,
      },
      {
        label: 'Improvement Area',
        value: OpaStore.getImprovementArea,
      }
    ]
  } else {
    return []
  }
});

const cityatlasVertTable3Data = computed(() => {
  if(GeocodeStore.aisData.features && GeocodeStore.aisData.features.length || OpaStore.rows && OpaStore.rows.length) {
    return [
      {
        label: 'Sale Price',
        value: OpaStore.getSalePrice,
      },
      {
        label: 'Sale Date',
        value: OpaStore.getSaleDate || 'none',
      },
    ]
  } else {
    return []
  }
});

const opaAccountNumber = computed(() => GeocodeStore.aisData.features ? GeocodeStore.aisData.features[0].properties.opa_account_num : null );

const shouldShowCondosMessage = computed(() => {
  if (!OpaStore.opaData.rows || !CondosStore.condosData.pages.page_1.features) return false;
  if (CondosStore.condosData.pages.page_1.features.length == 1 && CondosStore.condosData.pages.page_1.features[0].match_type == 'has_base_no_suffix_unit_child') return false;
  return CondosStore.condosData.pages.page_1.features.length >= 1;
});

const hasNoData = computed(() => {
  return !OpaStore.opaData.rows || !OpaStore.opaData.rows.length;
});

const valuationHistory = computed(() => {
  let data;
  if (OpaStore.assessmentHistory.rows && OpaStore.assessmentHistory.rows.length > 0) {
    data = OpaStore.assessmentHistory.rows.map(row => {
      return {
        year: row.year,
        market_value: row.market_value ? currency(row.market_value) : "$0",
        taxable_land: row.taxable_land ? currency(row.taxable_land) : "$0",
        taxable_building: row.taxable_building ? currency(row.taxable_building) : "$0",
        exempt_land: row.exempt_land ? currency(row.exempt_land) : "$0",
        exempt_building: row.exempt_building ? currency(row.exempt_building) : "$0",
      }
    });
  }
  return data;
})

const valuationHistoryLength = computed(() => {
  if (!valuationHistory.value) return 0;
  return valuationHistory.value.length;
})

const valuationHistoryTableData = computed(() => {
  return {
    columns: [
      {
        label: 'Year',
        field: 'year',
      },
      {
        label: 'Market Value',
        field: 'market_value'
      },
      {
        label: 'Taxable Land',
        field: 'taxable_land',
      },
      {
        label: 'Taxable Improvement',
        field: 'taxable_building',
      },
      {
        label: 'Exempt Land',
        field: 'exempt_land',
      },
      {
        label: 'Exempt Improvement',
        field: 'exempt_building',
      },
    ],
    rows: valuationHistory.value || [],
  }
})

</script>

<template>
  <section>
    <div
      v-if="!hasNoData"
      id="Property-description"
      class="topic-info"
    >
      Property assessment and sale information for this address. Source: Office of Property Assessments (OPA). OPA was formerly a part of the Bureau of Revision of Taxes (BRT) and some City records may still use that name.
    </div>

    <div
      v-if="MainStore.appVersion == 'atlas' && !hasNoData"
      class="mb-2"
    >
      <vertical-table
        table-id="opaTable"
        :data="atlasVertTableData"
      />
      <a
        v-if="!hasNoData"
        class="table-link"
        target="_blank"
        :href="`https://property.phila.gov/?p=${opaAccountNumber}`"
      >See more at Property Search <font-awesome-icon icon="fa-solid fa-external-link" /></a>
    </div>

    <div v-if="MainStore.appVersion == 'cityatlas' && !hasNoData">
      <vertical-table
        table-id="cityatlasTable1"
        :data="cityatlasVertTable1Data"
      />
      <br>
      <h2 class="subtitle mb-3 is-5 table-title">
        Property Characteristics
      </h2>
      <vertical-table
        table-id="cityatlasTable2"
        :data="cityatlasVertTable2Data"
      />
      <br>
      <h2 class="subtitle mb-3 is-5 table-title">
        Sales Details
      </h2>
      <vertical-table
        table-id="cityatlasTable3"
        :data="cityatlasVertTable3Data"
      />
      <br>
      <div class="data-section">
        <h2 class="subtitle mb-3 is-5 table-title">
          Valuation History
          <font-awesome-icon
            v-if="OpaStore.loadingOpaData"
            icon="fa-solid fa-spinner"
            spin
          />
          <span v-else>({{ valuationHistoryLength }})</span>
        </h2>
        <div
          v-if="valuationHistoryTableData.rows"
          class="horizontal-table"
        >
          <vue-good-table
            id="valuation-history"
            :columns="valuationHistoryTableData.columns"
            :rows="valuationHistoryTableData.rows"
            :pagination-options="paginationOptions(valuationHistoryTableData.rows.length)"
            style-class="table"
          >
            <template #emptystate>
              <div v-if="OpaStore.loadingOpaData">
                Loading valuation history... <font-awesome-icon
                  icon="fa-solid fa-spinner"
                  spin
                />
              </div>
              <div v-else>
                No valuation history found
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
      <div class="topic-info">
        Corrections to or questions about this property?<br>
        <a
          target="_blank"
          href="http://opa.phila.gov/opa.apps/Help/CitizenMain.aspx?sch=Ctrl2&s=1&url=search&id=3172000144"
        >Submit an Official Inquiry</a> to the Office of Property Assessment
      </div>
      <div class="topic-info">
        You can download the property assessment dataset in bulk, and get more information about this data at <a
          target="_blank"
          href="https://metadata.phila.gov/#home/datasetdetails/5543865f20583086178c4ee5/"
        >metadata.phila.gov</a>
      </div>
    </div>

    <div v-if="shouldShowCondosMessage">
      <h2 class="subtitle mt-3 mb-3 is-5">
        There {{ CondosStore.condosData.total_size > 1 ? 'are':'is' }} {{ CondosStore.condosData.total_size }} condominium {{ CondosStore.condosData.total_size > 1 ? 'units':'unit' }} at this address.
      </h2>
      <p>You can use the Condominiums tab below to see information for an individual unit.</p>
    </div>
    <div v-else-if="OpaStore.loadingOpaData">
      <p>
        Loading property assessment data... <font-awesome-icon
          icon="fa-solid fa-spinner"
          spin
        />
      </p>
    </div>
    <div
      v-else-if="hasNoData"
      class="summary"
    >
      <p>There is no property assessment record for this address.</p>
    </div>
  </section>
</template>

<style>

.summary {
  font-weight: bold;
}

@media
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {

  #valuation-history {

    td {
      padding-left: 120px !important;
    }
    td:before {
      width: 115px !important;
    }

    td:nth-of-type(4) { min-height: 60px;}
    td:nth-of-type(6) { min-height: 60px;}

    td:nth-of-type(1):before { content: "Year"; }
    td:nth-of-type(2):before { content: "Market Value"; }
    td:nth-of-type(3):before { content: "Taxable Land"; }
    td:nth-of-type(4):before { content: "Taxable Improvement"; }
    td:nth-of-type(5):before { content: "Exempt Land"; }
    td:nth-of-type(6):before { content: "Exempt Improvement"; }

  }

}

</style>
