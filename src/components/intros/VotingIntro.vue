<script setup>

import { useI18n } from 'vue-i18n'
const { t } = useI18n() 
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
        {{ $t('voting.introPage.introTitle') }}
      </h1>
      <p class="subtitle is-4">
        {{ $t('voting.introPage.p3') }}
      </p>
      <ul class="bullet-list">
        <li>{{ $t('voting.introPage.ul1.li1') }}</li>
        <li>{{ $t('voting.introPage.ul1.li2') }}</li>
        <li>{{ $t('voting.introPage.ul1.li3') }}</li>
        <li>{{ $t('voting.introPage.ul1.li4') }}</li>
      </ul>
      <br>

      <p><b>{{ $t('voting.introPage.p4_b') }}</b>{{ $t('voting.introPage.p4') }}</p>
      <br>

      <div
        class="topic-info voter-registry-notice"
        v-html="$t('voting.introPage.p5')"
      />

      <div
        class="section-header"
        :style="{ 'background-color': '#F0F0F0', 'color': 'black' }"
      >
        <b>{{ $t('voting.introPage.relatedContent') }}</b>
      </div>
      <div class="custom-section">
        <ul class="bullet-list">
          <li>
            <a
              target="_blank"
              href="https://www.pavoterservices.pa.gov/pages/voterregistrationstatus.aspx"
            >{{ $t('voting.introPage.link1') }}</a>
          </li>
          <li>
            <a
              target="_blank"
              href="https://www.pavoterservices.pa.gov/pages/ballottracking.aspx"
            >{{ $t('voting.introPage.link2') }}</a>
          </li>
          <li>
            <a
              target="_blank"
              href="https://vote.phila.gov/voting/vote-by-mail/vote-by-mail/"
            >{{ $t('voting.introPage.link3') }}</a>
          </li>
          <li>
            <a
              target="_blank"
              href="https://vote.phila.gov/ballot-drop-off/"
            >{{ $t('voting.introPage.link4') }}</a>
          </li>
          <li>
            <a
              target="_blank"
              href="https://vote.phila.gov/voting/important-dates-for-voters/"
            >{{ $t('voting.introPage.link5') }}</a>
          </li>
          <li>
            <a
              target="_blank"
              href="https://vote.phila.gov/voting/current-elected-officials/"
            >{{ $t('voting.introPage.link6') }}</a>
          </li>
          <li>
            <a
              target="_blank"
              href="https://vote.phila.gov/candidates-campaigns/campaign-finance/"
            >{{ $t('voting.introPage.link7') }}</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.voter-registry-notice {
  border: 1px solid #444;
  padding: 1rem;
  margin-bottom: 1.5rem;
}
</style>