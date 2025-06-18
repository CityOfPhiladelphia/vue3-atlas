<script setup>
import { ref, computed } from 'vue';
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();

const $emit = defineEmits(['setImagery']);
const dropdownValue = computed(() => MapStore.imagerySelected);

const imageryDropdownOpen = ref(false);
const toggleImageryDropdown = () => imageryDropdownOpen.value = !imageryDropdownOpen.value;

const emitValue = (value) => {
  $emit('setImagery', value);
  imageryDropdownOpen.value = false;
}

</script>

<template>
  <div
    :class="imageryDropdownOpen ? 'is-active' : ''"
    class="dropdown imagery-dropdown"
    @click="toggleImageryDropdown"
  >
    <div class="dropdown-trigger">
      <button
        class="button imagery-dropdown-button"
        aria-haspopup="true"
        aria-controls="dropdown-menu"
      >
        <span class="imagery-dropdown-value">{{ dropdownValue }}</span>
        <span class="icon is-small imagery-dropdown-icon">
          <font-awesome-icon
            icon="fa-solid fa-angle-down"
            aria-hidden="true"
          />
        </span>
      </button>
    </div>
    <div
      id="dropdown-menu"
      class="dropdown-menu"
      role="menu"
    >
      <div class="dropdown-content">
        <a
          class="dropdown-item"
          @click="emitValue('2024')"
        >2024</a>
        <a
          class="dropdown-item"
          @click="emitValue('2023')"
        >2023</a>
        <a
          class="dropdown-item"
          @click="emitValue('2022')"
        >2022</a>
        <a
          class="dropdown-item"
          @click="emitValue('2020')"
        >2020</a>
        <a
          class="dropdown-item"
          @click="emitValue('2019')"
        >2019</a>
        <a
          class="dropdown-item"
          @click="emitValue('2018')"
        >2018</a>
        <a
          class="dropdown-item"
          @click="emitValue('2017')"
        >2017</a>
        <a
          class="dropdown-item"
          @click="emitValue('2016')"
        >2016</a>
        <a
          class="dropdown-item"
          @click="emitValue('2015')"
        >2015</a>
        <a
          class="dropdown-item"
          @click="emitValue('2012')"
        >2012</a>
        <a
          class="dropdown-item"
          @click="emitValue('2010')"
        >2010</a>
        <a
          class="dropdown-item"
          @click="emitValue('2008')"
        >2008</a>
        <a
          class="dropdown-item"
          @click="emitValue('2004')"
        >2004</a>
        <a
          class="dropdown-item"
          @click="emitValue('1996')"
        >1996</a>
        <a
          class="dropdown-item"
          @click="emitValue('1962')"
        >1962</a>
        <a
          class="dropdown-item"
          @click="emitValue('1942')"
        >1942</a>
        <a
          class="dropdown-item"
          @click="emitValue('1910')"
        >1910</a>
        <a
          class="dropdown-item"
          @click="emitValue('1895')"
        >1895</a>
        <a
          class="dropdown-item"
          @click="emitValue('1875')"
        >1875</a>
        <a
          class="dropdown-item"
          @click="emitValue('1860')"
        >1860</a>
      </div>
    </div>
  </div>
</template>

<style>

.imagery-dropdown {
  position: absolute !important;
  top: 11px;
  right: 50px;
  z-index: 2;
}

.imagery-dropdown-button {
  padding-left: 0px !important;
  padding-right: 0px !important;
  padding-top: 3px !important;
  padding-bottom: 3px !important;
}

.imagery-dropdown-value {
  padding-left: 4px !important;
}

.imagery-dropdown-icon {
  margin-left: 0px !important;
}

@media 
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {
  
  .imagery-dropdown {
    top: 54px;
    right: 50px;
  }

  .imagery-dropdown-button {
    padding-top: 1px !important;
    padding-bottom: 1px !important;
  }
}

.img-src {
  max-width: 100%; 
  border-radius: 5px;
}

.imagery-dropdown .dropdown-menu .dropdown-content {
  width: 100px !important;
  height: 300px;
  overflow-y: auto;
}

</style>