<script setup>

import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();
import AddressSearchControl from '@/components/AddressSearchControl.vue';

</script>

<template>
  <div
    id="topic-panel-no-topics"
    class="section"
  >
    <div v-if="MainStore.fullScreenTopicsEnabled">
      <address-search-control :input-id="'address-bar-search-input'" />
    </div>
    <div :class="MainStore.fullScreenTopicsEnabled ? 'topic-panel-half': ''">
      <h1 class="subtitle is-3">
        Atlas is your front door to the City of Philadelphia.
      </h1>
      <p class="subtitle is-4">
        Here are some things you can do with Atlas:
      </p>
      <ul class="bullet-list">
        <li>Find your polling place</li>
        <li>Get the history of permits, licenses, and inspections at any address</li>
        <li>Research real estate information including property values, zoning, and document archives</li>
        <li>Get easy access to a variety of hard-to-find City resources</li>
        <li>View recent activity around your address, such as crimes, 311 service requests, and more</li>
        <li>Explore historical imagery and maps</li>
      </ul>
      <br>
      <p>To get started, click anywhere on the map, or type an address, intersection, property assessment account number, or Department of Records Map Registry number into the search box.</p>
    </div>
  </div>
</template>