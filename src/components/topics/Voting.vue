<script setup>

import { formatInTimeZone } from 'date-fns-tz';

import useTransforms from '@/composables/useTransforms';
const { nth, phoneNumber, titleCase } = useTransforms();

import { useVotingStore } from '@/stores/VotingStore';
import { computed, getCurrentInstance } from 'vue';
const VotingStore = useVotingStore();

import VerticalTable from '@/components/VerticalTable.vue';

const instance = getCurrentInstance();
import i18nFromFiles from '@/i18n/i18n.js';
const messages = computed(() => {
  return i18nFromFiles.i18n.data.messages[instance.appContext.config.globalProperties.$i18n.locale];
})

let fieldNames = {
  'ward': 'ward',
  'division': 'division',
  'placename': 'placename',
  'precinct': 'precinct',
  'street_address': 'street_address',
  'accessibility_code': 'accessibility_code',
  'parking_code': 'parking_code',
  'election_type': 'election_type',
  'election_date': 'election_date',
  'office_label': 'office_label',
  'ballot_file_id': 'ballot_file_id',
  'website': 'website',
  'first_name': 'first_name',
  'last_name': 'last_name',
  'district': 'district',
  'main_contact_address_2': 'main_contact_address_2',
  'main_contact_phone_1': 'main_contact_phone_1',
  'main_contact_phone_2': 'main_contact_phone_2',
  'main_contact_fax': 'main_contact_fax',
  'email': 'email',
  'next_election': 'next_election',
};
if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'arcgis') {
  for (let field of Object.keys(fieldNames)) {
    fieldNames[field] = fieldNames[field].toUpperCase();
  }
}

const electedOfficials = computed(() => {
  if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'carto') {
    if (!VotingStore.electedOfficials.rows || !VotingStore.electedOfficials.rows.length) return null;
    return VotingStore.electedOfficials.rows;
  } else if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'arcgis') {
    if (!VotingStore.electedOfficials.features || !VotingStore.electedOfficials.features.length) return null;
    return VotingStore.electedOfficials.features.map((feature) => feature.properties);
  }
});

const council = computed(() => {
  if (electedOfficials.value) {
    return electedOfficials.value.filter((item) => {
      return item[fieldNames.office_label] == "City Council";
    });
  } else {
    return null;
  }
});

const electionSplit = computed(() => {
  if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'carto') {
    if (VotingStore.electionSplit.rows && VotingStore.electionSplit.rows[0]) {
      return VotingStore.electionSplit.rows[0];
    }
  } else if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'arcgis') {
    if (VotingStore.electionSplit.features && VotingStore.electionSplit.features[0]) {
      return VotingStore.electionSplit.features[0].properties;
    }
  }
});

const ballotFileId = computed(() => {
  if (electionSplit.value) {
    return electionSplit.value[fieldNames.ballot_file_id];
  }
});

const councilMember = computed(() => {
  if (council.value && council.value[0]) {
    return '<a href="http://' + council.value[0][fieldNames.website] + '" target="_blank">' +
      council.value[0][fieldNames.first_name] +" " +council.value[0][fieldNames.last_name] + " - " + nth(council.value[0][fieldNames.district]) + " Council District </a>";
  }
});

const office = computed(() => {
  if (council.value && council.value[0]) {
    return council.value[0][fieldNames.main_contact_address_2] + '<br>' +
      phoneNumber(council.value[0][fieldNames.main_contact_phone_1]) + ", " + phoneNumber(council.value[0][fieldNames.main_contact_phone_2]) + '<br>\
      F: '+ phoneNumber(council.value[0][fieldNames.main_contact_fax]) + ' <br>\
      <b><a href=mailto:"' + council.value[0][fieldNames.email] + '">' + council.value[0][fieldNames.email] + '</a></b>';
  }
});

const term = computed(() => {
  if (council.value && council.value[0]) {
    return council.value[0][fieldNames.next_election] - 4 + ' - ' + council.value[0][fieldNames.next_election];
  }
});

const pollingPlacesData = computed(() => {
  if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'carto') {
    if (VotingStore.pollingPlaces.rows) {
      return VotingStore.pollingPlaces.rows[0];
    }
  } else if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'arcgis') {
    if (VotingStore.pollingPlaces.features) {
      return VotingStore.pollingPlaces.features[0].properties;
    }
  }
});

const accessibility = computed(() => {
  if (pollingPlacesData.value) {
    const code = pollingPlacesData.value[fieldNames.accessibility_code];
    const answer = code== "F" ? 'buildingFullyAccessible' :
      code== "B" ? 'buildingSubstantiallyAccessible' :
      code== "M" ? 'buildingAccessibilityModified' :
      code== "A" ? 'alternateEntrance' :
      code== "R" ? 'buildingAccessibleWithRamp' :
      code== "N" ? 'buildingNotAccessible' :
      'informationNotAvailable';
    return answer;
  }
});

const parking = computed(() => {
  if (pollingPlacesData.value) {
    const code = pollingPlacesData.value[fieldNames.parking_code];
    const parking = code == "N" ? 'noParking' :
      code == "G" ? 'generalParking' :
      code == "L" ? 'loadingZone' :
      'informationNotAvailable';
    return parking;
  }
});

const pollingPlaceTableData = computed(() => {
  if (pollingPlacesData.value) {
    return [
      {
        label: messages.value.voting.topic.location,
        value: '<b>Ward ' + pollingPlacesData.value[fieldNames.ward] + ', Division ' + pollingPlacesData.value[fieldNames.division] + '</b><br>' +
            titleCase(pollingPlacesData.value[fieldNames.placename]) + '<br>' +
            `<a target="_blank" href="https://www.google.com/maps/place/${pollingPlacesData.value[fieldNames.street_address]}, Philadelphia, PA">${titleCase(pollingPlacesData.value[fieldNames.street_address])}</a>`,
      },
      {
        label: messages.value.voting.topic.hours,
        value: messages.value.voting.introPage.p4,
      },
      {
        label: messages.value.voting.topic.accessibility,
        value: `<a target="_blank" href="https://vote.phila.gov/voting/voting-at-the-polls/polling-place-accessibility/">${messages.value.voting.topic.accessibilityCodes[accessibility.value]}</a>`,
      },
      {
        label: messages.value.voting.topic.parking,
        value: messages.value.voting.topic.parkingCodes[parking.value],
      },
    ];
  }
});

const electedRepsData = computed(() => [
  {
    label: messages.value.voting.topic.districtCouncilMember,
    value: councilMember.value,
  },
  {
    label: messages.value.voting.topic.cityHallOffice,
    value: office.value,
  },
  {
    label: messages.value.voting.topic.currentTerm,
    value: term.value,
  }
]);

const electionTypes = {
  0: 'voting.topic.badge1.specialElection',
  1: 'voting.topic.badge1.primaryElection',
  2: 'voting.topic.badge1.generalElection',
}

const electionDate = computed(() => {
  if (electionSplit.value) {
    return formatInTimeZone(electionSplit.value[fieldNames.election_date], 'America/New_York', 'MMMM d, yyyy');
    // if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'carto') {
    //   if (import.meta.env.VITE_DEBUG == 'true') console.log('typeof electionSplit.value[fieldNames.election_date]:', typeof electionSplit.value[fieldNames.election_date]);
    //   return formatInTimeZone(electionSplit.value[fieldNames.election_date], 'America/New_York', 'MMMM d, yyyy');
    // } else if (import.meta.env.VITE_VOTING_DATA_SOURCE === 'arcgis') {
    //   return formatInTimeZone(electionSplit.value[fieldNames.election_date], 'America/New_York', 'MMMM d, yyyy');
    // }
  }
});

</script>

<template>
  <section>
    <div class="columns is-multiline column is-10 is-offset-1 has-text-centered badge">
      <div v-if="electionSplit" class="column is-12 badge-title">
        <b>{{ $t(electionTypes[electionSplit[fieldNames.election_type]]) }}</b>
      </div>
      <div
        v-if="VotingStore.loadingVotingData === false"
        class="column is-12 election"
      >
        {{ electionDate }}
      </div>
      <div v-else class="column election">
        <p>
          <font-awesome-icon
            icon="fa-solid fa-spinner"
            spin
          />
        </p>
      </div>
    </div>
  </section>
  <div class="mt-3 mb-3 has-text-centered">
    <a
      target="_blank"
      :href="ballotFileId"
    >{{ $t('voting.topic.previewBallot') }} <font-awesome-icon icon="fa-solid fa-external-link" /></a>
  </div>

  <div
    id="Voting-description"
    class="topic-info"
    v-html="$t('voting.topic.callout1.text')"
  >
  </div>

  <h2 class="subtitle is-5 vert-table-title">
    {{ $t('voting.topic.pollingPlace') }}
  </h2>
  <vertical-table
    v-if="!VotingStore.loadingVotingData"
    :table-id="'pollingPlaceTable'"
    :data="pollingPlaceTableData"
  />
  <div v-else>
    <p>
      Loading polling place data... <font-awesome-icon
        icon="fa-solid fa-spinner"
        spin
      />
    </p>
  </div>
  <a
    class="table-link"
    target="_blank"
    :href="`https://vote.phila.gov/voting/vote-by-mail/`"
  >{{ $t('voting.topic.verticalTable1.link') }} <font-awesome-icon icon="fa-solid fa-external-link" /></a>
  <br>
  <br>

  <h2 class="subtitle is-5 vert-table-title">
    {{ $t('voting.topic.electedRep') }}
  </h2>
  <vertical-table
    v-if="!VotingStore.loadingVotingData"
    :table-id="'electedRepsTable'"
    :data="electedRepsData"
  />
  <div v-else>
    <p>
      Loading elected representatives data... <font-awesome-icon
        icon="fa-solid fa-spinner"
        spin
      />
    </p>
  </div>
  <a
    class="table-link"
    target="_blank"
    :href="`https://vote.phila.gov/voting/current-elected-officials/`"
  >{{ $t('voting.topic.verticalTable2.link') }} <font-awesome-icon icon="fa-solid fa-external-link" /></a>
  <br>
  <br>
</template>

<style scoped>

.badge-title {
  padding-top: 0.25rem !important;
  line-height: 1.2rem;
  padding-bottom: 4px;
  height: auto;
  color: white;
  border-width: 1px;
  border-style: solid;
  border-color: white;
  background-color: rgb(68, 68, 68);
}

.election {
  font-size: 2rem;
  line-height: 2.3rem;
  background-color: #f0f0f0;
  border-width: 1px;
  border-style: solid;
  border-color: white;
}

</style>