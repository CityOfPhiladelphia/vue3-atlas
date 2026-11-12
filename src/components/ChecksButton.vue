<script setup>

import { ref, watch } from 'vue';
import { useMainStore } from '@/stores/MainStore.js';
import useChecks, { SEVERITY_ICONS, SEVERITY_LABELS } from '@/composables/useChecks.js';

const MainStore = useMainStore();
const { worstSeverity, loading } = useChecks();

const buttonEl = ref(null);

// focus comes back to this button when the Checks panel closes
watch(() => MainStore.checksPanelOpen, (open, wasOpen) => {
  if (wasOpen && !open && buttonEl.value) {
    buttonEl.value.focus();
  }
});

</script>

<template>
  <button
    ref="buttonEl"
    class="checks-button"
    :class="loading ? 'checks-button-loading' : `checks-button-${worstSeverity}`"
    aria-controls="checks-panel"
    :aria-expanded="MainStore.checksPanelOpen"
    :aria-label="loading ? 'Property checks: loading' : `Property checks: ${SEVERITY_LABELS[worstSeverity]}`"
    @click="MainStore.checksPanelOpen = !MainStore.checksPanelOpen"
  >
    <font-awesome-icon
      v-if="loading"
      icon="fa-solid fa-spinner"
      spin
      aria-hidden="true"
    />
    <font-awesome-icon
      v-else
      :icon="SEVERITY_ICONS[worstSeverity]"
      aria-hidden="true"
    />
  </button>
</template>

<style scoped>

.checks-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 1em;
  width: 2.25em;
  height: 2.25em;
  border-radius: 50%;
  border: 2px solid currentColor;
  background-color: #ffffff;
  font-size: 1.25rem;
  cursor: pointer;
}

.checks-button-loading {
  color: #6b6b6b;
}

.checks-button-red {
  color: #cc3000;
}

.checks-button-yellow {
  color: #b35900;
}

.checks-button-green {
  color: #2e7d32;
}

.checks-button-grey {
  color: #6b6b6b;
}

</style>
