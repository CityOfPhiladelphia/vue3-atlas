<script setup type='ts'>

import { parseISO, format } from 'date-fns';

import useTransforms from '@/composables/useTransforms';
const { nth, phoneNumber, titleCase } = useTransforms();

import { useVotingStore } from '@/stores/VotingStore';
import { computed } from 'vue';
const VotingStore = useVotingStore();

import VerticalTable from '@/components/VerticalTable.vue';

const electedOfficials = computed(() => {
  if (!VotingStore.electedOfficials.rows || !VotingStore.electedOfficials.rows.length) return null;
  return VotingStore.electedOfficials.rows;
});

const council = computed(() => {
  if (electedOfficials.value) {
    return electedOfficials.value.filter((item) => {
      return item.office_label == "City Council";
    });
  } else {
    return null;
  }
});

const ballotFileId = computed(() => {
  if (electedOfficials.value) {
    return electedOfficials.value[0].ballot_file_id;
  } else {
    return null;
  }
});

const councilMember = computed(() => {
  if (council.value && council.value[0]) {
    return '<a href="http://' + council.value[0].website + '" target="_blank">' +
      council.value[0].first_name +" " +council.value[0].last_name + " - " + nth(council.value[0].district) + " Council District </a>";
  }
});

const office = computed(() => {
  if (council.value && council.value[0]) {
    return council.value[0].main_contact_address_2 + '<br>' +
      phoneNumber(council.value[0].main_contact_phone_1) + ", " + phoneNumber(council.value[0].main_contact_phone_2) + '<br>\
      F: '+ phoneNumber(council.value[0].main_contact_fax) + ' <br>\
      <b><a href=mailto:"' + council.value[0].email + '">' + council.value[0].email + '</a></b>';
  }
});

const term = computed(() => {
  if (council.value && council.value[0]) {
    return council.value[0].next_election - 4 + ' - ' + council.value[0].next_election;
  }
});

const accessibility = computed(() => {
  if (VotingStore.pollingPlaces.rows && VotingStore.pollingPlaces.rows.length) {
    const code = VotingStore.pollingPlaces.rows[0].accessibility_code;
    const answer = code== "F" ? 'Building Fully Accessible' :
      code== "B" ? 'Building Substantially Accessible' :
      code== "M" ? 'Building Accessibility Modified' :
      code== "A" ? 'Alternate Entrance' :
      code== "R" ? 'Building Accessible With Ramp' :
      code== "N" ? 'Building Not Accessible' :
      'Information Not Available';
    return answer;
  }
});

const parking = computed(() => {
  if (VotingStore.pollingPlaces.rows && VotingStore.pollingPlaces.rows.length) {
    const code = VotingStore.pollingPlaces.rows[0].parking_info;
    const parking = code == "N" ? 'No Parking' :
      code == "G" ? 'General Parking' :
      code == "L" ? 'Loading Zone' :
      'Information Not Available';
    return parking;
  }
});

const pollingPlaceData = computed(() => {
  if (VotingStore.pollingPlaces.rows && VotingStore.pollingPlaces.rows.length) {
    return [
      {
        label: 'Location',
        value: '<b>Ward ' + VotingStore.pollingPlaces.rows[0].ward + ', Division ' + VotingStore.pollingPlaces.rows[0].division + '</b><br>' +
            titleCase(VotingStore.pollingPlaces.rows[0].placename) + '<br>' +
            titleCase(VotingStore.pollingPlaces.rows[0].street_address)
      },
      {
        label: 'Hours',
        value: 'All polling places will be open on election day from 7 a.m. to 8 p.m.'
      },
      {
        label: 'Accessibility',
        value: `<a target="_blank" href="https://vote.phila.gov/voting/voting-at-the-polls/polling-place-accessibility/">${accessibility.value}</a>`,
      },
      {
        label: 'Parking',
        value: parking.value,
      },
    ];
  }
});

const electedRepsData = computed(() => [
  {
    label: 'District Council Member',
    value: councilMember.value,
  },
  {
    label: 'City Hall Office',
    value: office.value,
  },
  {
    label: 'Current Term',
    value: term.value,
  }
]);

const electionSplit = computed(() => {
  if (VotingStore.electionSplit.rows && VotingStore.electionSplit.rows[0]) {
    return VotingStore.electionSplit.rows[0];
  }
});

const electionTypes = {
  0: 'Special Election',
  1: 'Primary Election',
  2: 'General Election',
}

</script>

<template>
  <section>
    <div class="columns is-multiline column is-8 is-offset-2 has-text-centered badge">
      <div v-if="electionSplit" class="column is-12 badge-title">
        <b>Next Eligible Election: {{ electionTypes[electionSplit.election_type] }}</b>
      </div>
      <div
        v-if="electionSplit && VotingStore.loadingVotingData === false"
        class="column is-12 election"
      >
        {{ format(parseISO(electionSplit.election_date), 'MMMM d, yyyy') }}
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
    >Preview ballot <font-awesome-icon icon="fa-solid fa-external-link-alt" /></a>
  </div>

  <div
    id="Voting-description"
    class="topic-info"
  >
    The deadline to register for the next election is 15 days prior to the election. You can confirm your registration and learn about registering to vote at <a
      target="_blank"
      href="https://vote.phila.gov"
    >vote.phila.gov</a>.
  </div>

  <h2 class="subtitle is-5 vert-table-title">
    Polling Place
  </h2>
  <vertical-table
    v-if="!VotingStore.loadingVotingData"
    :table-id="'pollingPlaceTable'"
    :data="pollingPlaceData"
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
  >Learn about your voting options if you cannot vote in person on Election Day <font-awesome-icon icon="fa-solid fa-external-link-alt" /></a>
  <br>
  <br>

  <h2 class="subtitle is-5 vert-table-title">
    Elected Representatives
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
  >See all citywide, state, and federal representatives <font-awesome-icon icon="fa-solid fa-external-link-alt" /></a>
  <br>
  <br>
</template>

<style scoped>

.badge-title {
  padding-top: 0.25rem !important;
  height: 2rem;
  color: white;
  border-width: 1px;
  border-style: solid;
  border-color: white;
  background-color: rgb(68, 68, 68);
}

.election {
  font-size: 2rem;
  background-color: #f0f0f0;
  border-width: 1px;
  border-style: solid;
  border-color: white;
}

</style>