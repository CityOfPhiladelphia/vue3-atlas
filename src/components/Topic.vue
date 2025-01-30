<script setup>

import { computed } from 'vue';
import { useMainStore } from '@/stores/MainStore.js';

const MainStore = useMainStore();

const props = defineProps({
  topicName: {
    type: String,
    default: '',
  },
  topicSlug: {
    type: String,
    default: '',
  },
  topicIcon: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  topicIndex: {
    type: Number,
    default: 1,
  }
});

import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

import useRouting from '@/composables/useRouting';
const { routeApp } = useRouting();

const open = computed(() => {
  return route.params.topic == props.topicSlug ? true : false;
});

const handleTopicClick = () => {
  if (props.topicSlug == route.params.topic) {
    MainStore.currentTopic = '';
  } else {
    MainStore.currentTopic = props.topicSlug;
  }
  if (import.meta.env.VITE_DEBUG == 'true') console.log('topic clicked:', props.topicName);
  routeApp(router, route);

  setTimeout(() => {
    const element = document.getElementById(props.topicName+'-topic');
    if (import.meta.env.VITE_DEBUG == 'true') console.log('element:', element);
    let panel = null;
    if (MainStore.isMobileDevice || MainStore.windowDimensions.width <= 768) {
      panel = document.getElementById('main');
      const scrollValue = 315 + props.topicIndex * 62;
      panel.scrollTo({
        top: scrollValue,
      });
    } else {
      element.scrollIntoView();//{behavior: 'smooth'});
    }
  }, '100');
}

</script>

<template>
  <section :id="topicName+'-topic'">
    <button
      class="topic is-vcentered"
      @click="handleTopicClick"
    >
      <div class="topic-name">
        <div class="icon-holder">
          <font-awesome-icon :icon="props.topicIcon" />
        </div>
        <h1 class="name-holder">
          {{ topicName }}
        </h1>
        <div
          v-if="open && loading"
          class="mr-2 is-pulled-right"
        >
          <font-awesome-icon
            icon="fa-solid fa-spinner"
            spin
          />
        </div>
      
        <div
          class="mr-2 is-pulled-right icon-holder"
        >
          <font-awesome-icon
            v-if="!open"
            icon="fa-solid fa-plus"
          />
          <font-awesome-icon
            v-if="open && !loading"
            icon="fa-solid fa-minus"
          />
        </div>
      </div>
    </button>
    <div
      v-if="open"
    >
      <div class="inside-topic">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>

.icon-holder {
  display: inline-block;
  margin-left: .25em;
  margin-right: .5em;
  /* margin-bottom: .5em; */
  width: 1em;
  font-size: 20px;
}

.name-holder {
  display: inline-block;
  font-weight: 600;
  font-family: Montserrat !important;
  font-size: 20px !important;
}

.is-vcentered {
  display: flex;
  flex-wrap: wrap;
  align-content: center; /* used this for multiple child */
  align-items: center; /* if an only child */
}

.topic {
  font-size: .75em;
  height: 60px;
  background-color: #f0f0f0;
  color: #0f4d90;
  border: 0px solid #cfcfcf;
  /* margin-top: 16px; */
  margin-top: .5em;
  padding: .25em;
  cursor: pointer;
  width: 100%;
  text-align: left;
}

.topic:hover, .topic:active {
  background-color: #cfcfcf;
  /* background-color: #fff; */
  color: #000
}

.topic-name {
  width: 100%;
  font-size: 1.75em !important;
}

.inside-topic {
  background-color: #ffffff;
  font-size: 1em;
  padding: 1em;
  left: 0 !important;
  right: 0 !important;
}

</style>