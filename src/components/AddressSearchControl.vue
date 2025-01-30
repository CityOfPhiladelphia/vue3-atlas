<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();

const router = useRouter();
const route = useRoute();

defineProps({
  inputId: {
    type: String,
    default: 'address-search-input',
  },
});

const clearAddress = () => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('clearAddress is running');
  MainStore.addressSearchValue = '';
}

const fullScreenTopicsEnabled = computed(() => {
  return MainStore.fullScreenTopicsEnabled;
});
  
const fullScreenMapEnabled = computed(() => {
  return MainStore.fullScreenMapEnabled;
});
    
const holderWidth = computed(() => {
  if (fullScreenTopicsEnabled.value || fullScreenMapEnabled.value) {
    return '40%';
  } else {
    return '70%';
  }
});

const yPosition = computed(() => {
  if (fullScreenTopicsEnabled.value) {
    return '88px';
  } else {
    return '10px';
  }
});

const replaceRoute = (address) => {
  let startQuery = { ...route.query };
  router.replace({ name: 'search', query: { ...startQuery, address: address }});
}

</script>

<template>
  <div
    :class="fullScreenTopicsEnabled ? 'holder holder-topics' : 'holder holder-map'"
    :style="{ top: yPosition, width: holderWidth }"
  >
    <div class="field has-addons" :style="{ width: '100%' }">
      <div class="control has-icons-right" :style="{ width: '100%' }">
        <label
          :for="inputId"
          class="search-label"
        >Search for an address, OPA account, or DOR number</label>
        <input
          :id="inputId"
          v-model="MainStore.addressSearchValue"
          class="input address-input"
          type="text"
          placeholder="Search for an address, OPA account, or DOR number"
          @keydown.enter="replaceRoute(MainStore.addressSearchValue)"
        >
      </div>
      <div class="control">
        <button
          v-if="MainStore.addressSearchValue != ''"
          class="button is-info address-clear-button"
          title="Clear Address Button"
          @click="clearAddress"
        >
          <font-awesome-icon
            :icon="['fas', 'times']"
            size="xl"
          />
        </button>
      </div>
      <div class="control">
        <button
          class="button is-info address-search-button"
          type="submit"
          title="Address Search Button"
          @click="replaceRoute(MainStore.addressSearchValue)"
        >
          <font-awesome-icon
            :icon="['fas', 'search']"
            size="xl"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.search-label {
  /* display: none !important */
  position: absolute;
  top: -9999px;
  left: -9999px;
}

.holder {
  position: absolute;
  display: flex;
  flex-direction: row;
}

.holder-map {
  left: 10px;
}

.holder-topics {
  right: 10px;
}

.address-input {
  border-radius: 0px !important;
  border-style: solid;
  border-width: 2px;
  border-color: #0f4d90;
  background-color: white;
  border-radius: 3px;
  z-index: 2;
}

.address-input:hover {
  border-color: #2176d2;
}

.address-clear-button {
  background-color: #0f4d90 !important;
  height: 2.5em !important;
  z-index: 2;
  border-right: solid 3px white !important;
}

.address-clear-button:hover {
  background-color: #2176d2 !important;
}

.address-search-button {
  background-color: #0f4d90 !important;
  height: 2.5em !important;
  padding-left: 10px !important;
  padding-right: 10px !important;
  border-top-right-radius: 0px !important;
  border-bottom-right-radius: 0px !important;
  z-index: 2;
}

.address-search-button:hover {
  background-color: #2176d2 !important;
}

</style>