
<script setup>

import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();

defineEmits(['setTextFilter', 'clearTextFilter']);

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  searchLabel: {
    type: String,
    default: 'Search',
  },
  placeholder: {
    type: String,
    default: 'text',
  },
})

const model = defineModel();
const clearText = () => model.value = '';

</script>

<template>
  <div class="filter-div columns is-mobile">
    <div class="column textbox-div is-10 small-is-9 pr-0 pt-0 pb-0">
      <textbox
        id="searchBar"
        v-model="model"
        :placeholder="placeholder"
        :label="searchLabel"
        :inner-label="false"
        class="search-box"
      />
    </div>
    <div class="column is-2 small-is-2 pl-0">
      <button
        v-if="model !== null && model !== ''"
        type="submit"
        class="button clear-button"
        @click="clearText"
      >
        <span
          v-if="!MainStore.isMobileDevice"
          class="clear-span pl-0"
        >CLEAR</span>
        <i class="fas fa-times-circle" />
      </button>
    </div>
  </div>
</template>

<style scoped>

.textbox-div {
  padding: 0px;
}

.clear-span {
  padding-left: 0px !important;
}

button.button.clear-button {
  /* position: relative;
  right: -240px;
  top: -50px; */
  width: 86px;
  font-size: 12px !important;
  border: none;
  background: #96c9ff;
  color: #444444;
  border-radius: 40px !important;
  padding: 3px;
  padding-left: 0px;
  margin-top: 30px;
  height: 15px;
  i {
    margin-left: 5px;
  }
  &:focus {
    box-shadow: none !important;
  }
}

@media
only screen and (max-width: 768px)
{

  button.button.clear-button {
    width: 40px;
    padding: 8px;
  }
}


</style>
