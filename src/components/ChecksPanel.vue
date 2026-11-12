<script setup>

import { ref, onMounted } from 'vue';
import { useMainStore } from '@/stores/MainStore.js';
import useChecks, { SEVERITY_ICONS, SEVERITY_LABELS } from '@/composables/useChecks.js';

const MainStore = useMainStore();
const { checks, loading } = useChecks();

const headingEl = ref(null);

// keyboard and screen reader users land on the panel's heading when it opens
onMounted(() => {
  headingEl.value.focus();
});

const close = () => {
  MainStore.checksPanelOpen = false;
};

</script>

<template>
  <section
    id="checks-panel"
    class="checks-panel"
    aria-labelledby="checks-heading"
    @keydown.esc="close"
  >
    <div class="checks-card">
      <div class="checks-header">
        <h2
          id="checks-heading"
          ref="headingEl"
          class="checks-heading"
          tabindex="-1"
        >
          Checks
        </h2>
        <button
          class="checks-close"
          aria-label="Close checks"
          @click="close"
        >
          <font-awesome-icon
            icon="fa-solid fa-times"
            aria-hidden="true"
          />
        </button>
      </div>

      <p class="checks-intro">
        These checks report on the status of property requirements of public concern at this location.
        Most of this data updates daily.
      </p>

      <p v-if="loading">
        <font-awesome-icon
          icon="fa-solid fa-spinner"
          spin
          aria-hidden="true"
        />
        Loading checks…
      </p>

      <ul
        v-else
        class="checks-list"
      >
        <li
          v-for="check in checks"
          :key="check.id"
          class="check"
          :class="`check-${check.severity}`"
        >
          <div class="check-icon">
            <font-awesome-icon
              :icon="SEVERITY_ICONS[check.severity]"
              aria-hidden="true"
            />
            <span class="is-sr-only">{{ SEVERITY_LABELS[check.severity] }}:</span>
          </div>
          <div class="check-body">
            <p>
              <strong>{{ check.title }}</strong>
              <em> ({{ check.department }})</em>
            </p>
            <ul
              v-if="check.bullets.length"
              class="check-bullets"
            >
              <li
                v-for="(bullet, bulletIndex) in check.bullets"
                :key="bulletIndex"
              >
                <template
                  v-for="(part, partIndex) in bullet"
                  :key="partIndex"
                >
                  <a
                    v-if="part.href"
                    :href="part.href"
                    target="_blank"
                  >{{ part.text }}</a>
                  <template v-else>
                    {{ part }}
                  </template>
                </template>
              </li>
            </ul>
          </div>
        </li>
      </ul>

      <div class="checks-beta">
        This section of Atlas is in beta. We are continuing to build out information about requirements
        and public concerns. Please submit your ideas and questions via our
        <a
          :href="`https://phila.formstack.com/forms/atlas_feedback_form?address=${encodeURIComponent(MainStore.currentAddress || '')}`"
          target="_blank"
        >Feedback form</a>.
      </div>
    </div>
  </section>
</template>

<style scoped>

.checks-panel {
  flex-grow: 1;
  overflow-y: auto;
  padding: 12px;
}

.checks-card {
  border: 2px solid #0f4d90;
  border-radius: 10px;
  padding: 1em;
}

.checks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checks-heading {
  font-family: Montserrat, sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
}

.checks-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #444444;
  cursor: pointer;
}

.checks-intro {
  margin: .5em 0 1em;
}

.checks-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.check {
  display: flex;
  margin-bottom: .75em;
}

.check-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 3em;
  font-size: 1.5rem;
  border-right: 3px solid #ffffff;
}

.check-body {
  padding: .5em .75em;
}

.check-bullets {
  list-style: disc;
  padding-left: 1.5em;
  margin: 0;
}

.check-red {
  background-color: #fdd7d0;
}

.check-red .check-icon {
  color: #cc3000;
}

.check-yellow {
  background-color: #fff6cc;
}

.check-yellow .check-icon {
  color: #b35900;
}

.check-green {
  background-color: #d8f2d0;
}

.check-green .check-icon {
  color: #2e7d32;
}

.check-grey {
  background-color: #f0f0f0;
}

.check-grey .check-icon {
  color: #6b6b6b;
}

.checks-beta {
  margin-top: 1em;
  padding: .75em;
  border-radius: 6px;
  background-color: #daedfe;
}

</style>
