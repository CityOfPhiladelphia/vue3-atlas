<script setup>

import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
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

// the open topic's header is "stuck" once its section has scrolled above the top of the
// topics panel, so its contents are scrolling under the header (which then gets a drop shadow)
const sectionEl = ref(null);
const stuck = ref(false);
let scrollPanel = null;

// Sets stuck from where this topic's section sits relative to the top of the topics panel
const updateStuck = () => {
  stuck.value = sectionEl.value.getBoundingClientRect().top < scrollPanel.getBoundingClientRect().top;
};

// Stops listening to the topics panel's scrolling and clears stuck
const stopWatchingScroll = () => {
  if (scrollPanel) {
    scrollPanel.removeEventListener('scroll', updateStuck);
    scrollPanel = null;
  }
  stuck.value = false;
};

// Starts listening to the topics panel's scrolling if this topic is open. Only the open topic
// listens. In the mobile layout the panel does not scroll (overflow-y: hidden), so no scroll
// events arrive and stuck stays false
const watchScrollIfOpen = () => {
  stopWatchingScroll();
  if (open.value && sectionEl.value) {
    scrollPanel = sectionEl.value.closest('#topic-panel-content');
    if (scrollPanel) {
      scrollPanel.addEventListener('scroll', updateStuck, { passive: true });
      updateStuck();
    }
  }
};

watch(open, watchScrollIfOpen, { flush: 'post' });
onMounted(watchScrollIfOpen);
onBeforeUnmount(stopWatchingScroll);

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
  <section
    :id="topicName+'-topic'"
    ref="sectionEl"
  >
    <button
      class="topic is-vcentered"
      :class="{ 'topic-open': open, 'topic-stuck': stuck }"
      @click="handleTopicClick"
    >
      <div class="topic-name">
        <div class="icon-holder">
          <!-- <i :class="props.topicIcon"></i> -->
          <!-- <font-awesome-icon :icon="['far', 'location-dot']" /> -->
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
  /* the open topic's header stays near the top of #topic-panel-content while its
  contents scroll under it, and leaves with its section once that scrolls past.
  In the mobile layout #topic-panel-content is overflow-y: hidden, so it does not stick there */
  position: sticky;
  top: .25em;
  z-index: 1;
}

/* white bands above and below the open topic's header, so scrolled contents disappear a
little short of the stuck header instead of right at its edges. When the header is not stuck,
the top band sits inside its .5em margin-top and the bottom band sits inside
.inside-topic's top padding, both already white, so neither is visible */
.topic-open {
  box-shadow: 0 .25em 0 #ffffff, 0 -.25em 0 #ffffff;
}

/* while contents scroll under the stuck header, a drop shadow replaces the white band below it */
.topic-stuck {
  box-shadow: 0 -.25em 0 #ffffff, 0 5px 8px -2px rgba(0, 0, 0, 0.4);
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

/* keeps keyboard-focused elements from landing under the sticky topic header */
.inside-topic :deep(*) {
  scroll-margin-top: 90px;
}

</style>