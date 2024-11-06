<script setup>

import { computed } from 'vue';
import { useMainStore } from '@/stores/MainStore.js'
const GeocodeStore = useGeocodeStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
const MainStore = useMainStore();
import { useCondosStore } from '@/stores/CondosStore.js'
const CondosStore = useCondosStore();

import FullScreenTopicsToggleTab from '@/components/FullScreenTopicsToggleTab.vue';
import AddressSearchControl from '@/components/AddressSearchControl.vue';

import Topic from '@/components/Topic.vue';
import AtlasIntro from '@/components/intros/AtlasIntro.vue';
import CityAtlasIntro from '@/components/intros/CityAtlasIntro.vue';
import VotingIntro from '@/components/intros/VotingIntro.vue';
import Property from '@/components/topics/Property.vue';
import Condos from '@/components/topics/Condos.vue';
import Deeds from '@/components/topics/Deeds.vue';
import LI from '@/components/topics/LI.vue';
import Zoning from '@/components/topics/Zoning.vue';
import Voting from '@/components/topics/Voting.vue';
import NearbyActivity from '@/components/topics/nearbyActivity/NearbyActivity.vue';
import City311 from '@/components/topics/cityAtlas/City311.vue';
import Stormwater from '@/components/topics/cityAtlas/Stormwater.vue';
import Districts from '@/components/topics/cityAtlas/Districts.vue';

import { useRoute } from 'vue-router';

const version = import.meta.env.VITE_VERSION;

const route = useRoute();

const address = computed(() => MainStore.currentAddress);
const dataSourcesLoadedArray = computed(() => MainStore.dataSourcesLoadedArray);

const zipCode = computed(() => {
  if (GeocodeStore.aisData && GeocodeStore.aisData.features) {
    return GeocodeStore.aisData.features[0].properties.zip_code + '-' + GeocodeStore.aisData.features[0].properties.zip_4;
  }
  return '';
});

</script>

<template>
  <full-screen-topics-toggle-tab
    v-show="!MainStore.fullScreenMapEnabled"
  />
      
  <!-- FRONT PAGE CONTENT -->
  <CityAtlasIntro v-if="route.name == 'home' && version == 'cityatlas'" />
  <VotingIntro v-else-if="route.name == 'topic' && route.params.topic.toLowerCase() == 'voting'"/>
  <AtlasIntro v-else-if="route.name == 'home'" />

  <!-- ADDRESS NOT FOUND CONTENT -->
  <div
    v-if="route.name == 'not-found'"
    id="topic-panel-no-topics"
    class="section"
  >
    <div v-if="MainStore.fullScreenTopicsEnabled">
      <address-search-control :input-id="'address-bar-search-input'" />
    </div>
    <div :class="MainStore.fullScreenTopicsEnabled ? 'topic-panel-half': ''">
      <h1 class="subtitle is-3">We couldn't find that address.</h1>
      <p class="subtitle is-4">Are you sure everything was spelled correctly?</p>
      <p>Here are some examples of things you can search for:</p>
      <ul class="bullet-list">
        <li>1234 Market St</li>
        <li>1001 Pine Street #201</li>
        <li>12th & Market</li>
        <li>883309050 (an OPA number with no hyphens or other characters)</li>
        <li>001S070144 (a DOR number with no hyphens of other characters)</li>
      </ul>
    </div>
  </div>

  <!-- IF AN ADDRESS IS LOADED, SHOW THE TOPICS  -->
  <div
    v-if="route.name !== 'home' && route.name !== 'not-found' && address"
    class="address-holder"
  >
    <div>
      <h1 class="address-and-marker subtitle is-3">
        <font-awesome-icon :icon="['fas', 'map-marker-alt']" /><div class="address">
          {{ address }}
        </div>
      </h1>
    </div>
    <div>PHILADELPHIA, PA {{ zipCode }}</div>

    <div v-if="MainStore.fullScreenTopicsEnabled">
      <address-search-control :input-id="'address-bar-search-input'" />
    </div>
  </div>

  <div
    v-if="route.name !== 'home' && route.name !== 'not-found' && route.name !== 'topic'"
    id="topic-panel-content"
    class="topics"
  >
    <!-- on election days, uncomment this, and comment the same code out below -->
    <!-- <topic
      v-if="MainStore.appVersion == 'atlas'"
      :topic-name="'Voting'"
      :topic-slug="'voting'"
      :topic-icon="'fa-solid fa-gavel'"
      :loading="!dataSourcesLoadedArray.includes('voting')"
      :topic-index="5"
    >
      <Voting />
    </topic> -->
    
    <topic
      :topic-name="'Property Assessments'"
      :topic-slug="'property'"
      :topic-icon="'fa-solid fa-home'"
      :loading="!dataSourcesLoadedArray.includes('property')"
      :topic-index="1"
    >
      <Property />
    </topic>

    <topic
      v-show="CondosStore.condosData.pages.page_1.features && CondosStore.condosData.pages.page_1.features.length"
      :topic-name="'Condominiums'"
      :topic-slug="'condos'"
      :topic-icon="'fa-solid fa-building'"
      :loading="!dataSourcesLoadedArray.includes('condos')"
      :topic-index="2"
    >
      <Condos v-if="dataSourcesLoadedArray.includes('condos')" />
    </topic>

    <topic
      :topic-name="'Deeds'"
      :topic-slug="'deeds'"
      :topic-icon="'fa-solid fa-book'"
      :loading="!dataSourcesLoadedArray.includes('deeds')"
      :topic-index="2"
    >
      <Deeds />
    </topic>

    <topic
      :topic-name="'Licenses & Inspections'"
      :topic-slug="'li'"
      :topic-icon="'fa-solid fa-wrench'"
      :loading="!dataSourcesLoadedArray.includes('li')"
      :topic-index="3"
    >
      <LI />
    </topic>

    <topic
      :topic-name="'Zoning'"
      :topic-slug="'zoning'"
      :topic-icon="'fa-solid fa-university'"
      :loading="!dataSourcesLoadedArray.includes('zoning')"
      :topic-index="4"
    >
      <Zoning />
    </topic>

    <topic
      v-if="MainStore.appVersion == 'atlas'"
      :topic-name="'Voting'"
      :topic-slug="'voting'"
      :topic-icon="'fa-solid fa-gavel'"
      :loading="!dataSourcesLoadedArray.includes('voting')"
      :topic-index="5"
    >
      <Voting />
    </topic>

    <topic
      v-if="MainStore.appVersion == 'cityatlas'"
      :topic-name="'311'"
      :topic-slug="'city311'"
      :topic-icon="'fa-solid fa-phone'"
      :loading="!dataSourcesLoadedArray.includes('city311')"
      :topic-index="5"
    >
      <City311 />
    </topic>

    <topic
      v-if="MainStore.appVersion == 'cityatlas'"
      :topic-name="'Stormwater'"
      :topic-slug="'stormwater'"
      :topic-icon="'fa-solid fa-tint'"
      :loading="!dataSourcesLoadedArray.includes('stormwater')"
      :topic-index="6"
    >
      <Stormwater />
    </topic>

    <topic
      :topic-name="'Nearby Activity'"
      :topic-slug="'nearby'"
      :topic-icon="'fa-solid fa-map-marker-alt'"
      :loading="!dataSourcesLoadedArray.includes('nearby')"
      :topic-index="7"
    >
      <KeepAlive>
        <NearbyActivity />
      </KeepAlive>
    </topic>

    <topic
      v-if="MainStore.appVersion == 'cityatlas'"
      :topic-name="'Districts'"
      :topic-slug="'districts'"
      :topic-icon="'fa-solid fa-clone'"
      :loading="!dataSourcesLoadedArray.includes('districts')"
      :topic-index="8"
    >
      <Districts />
    </topic>
  </div>
</template>

<style>

.address-and-marker {
  margin-top: .5rem !important;
  margin-bottom: 0px !important;
}

</style>