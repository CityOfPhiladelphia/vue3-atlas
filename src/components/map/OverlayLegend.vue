<script setup type='ts'>

import { computed, defineProps } from 'vue';

const props = defineProps({
  'position': {
    type: String,
    default: 'bottom-right',
  },
  'options': {
    type: Object,
    default: () => ({}),
  },
  'items': {
    type: Object,
    default: () => ({}),
  },
});

const keys = computed(() => {
  return Object.keys(props.items);
});

</script>

<template>
  <div
    class="legend-overlay"
  >
    <div class="legend legend-overlay-inner">
      <ul class="legend-list">
        <li
          v-for="key in keys"
          :key="key"
          :style="&quot;font-size:&quot;+items[key][&quot;font-size&quot;]+&quot;;&quot;"
          class="legend-listitem"
        >
          <div
            v-if="!props.options.shape || (props.options.shape && props.options.shape === 'square')"
            :style="&quot;background-color:&quot;+items[key][&quot;background-color&quot;]+
              &quot;; border-color:&quot;+items[key][&quot;border-color&quot;]+
              &quot;; border-style:&quot;+items[key][&quot;border-style&quot;]+
              &quot;; border-width:&quot;+items[key][&quot;border-weight&quot;]+
              &quot;; width:&quot;+items[key].width+
              &quot;; height:&quot;+items[key].height+&quot;;&quot;"
            class="legend-box"
          />
          <div
            v-if="props.options.shape === 'circle'"
            :style="&quot;background-color:&quot;+items[key][&quot;background-color&quot;]+
              &quot;; border-color:&quot;+items[key][&quot;border-color&quot;]+
              &quot;; border-style:&quot;+items[key][&quot;border-style&quot;]+
              &quot;; border-width:&quot;+items[key][&quot;border-weight&quot;]+
              &quot;; width:&quot;+items[key].width+
              &quot;; height:&quot;+items[key].height+&quot;;&quot;"
            class="legend-circle"
          />
          <div class="list-text">
            {{ key }}
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>

.legend-overlay {
  font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
  position: absolute;
  bottom: 0px;
  right: 45px !important;
  padding: 10px;
  z-index: 2;
}

.legend-overlay .legend-overlay-inner {
  display: inline-block;
  background-color: #fff;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  padding: 6px 8px;
}

.legend-overlay h2 {
  line-height: 24px;
  display: block;
  margin: 0 0 10px;
}

.legend-overlay .legend .bar {
  height: 10px;
  width: 100%;
  background: linear-gradient(to right, #fca107, #7f3121);
}

.legend-overlay input {
  background-color: transparent;
  display: inline-block;
  width: 100%;
  position: relative;
  margin: 0;
  cursor: ew-resize;
}

.legend-box {
  display: inline-block;
  width: 18px;
  height: 18px;
  opacity: 1;
  vertical-align: middle;
  margin-right: 4px;
}

.legend-circle {
  border-radius: 50%;
  display: inline-block;
  width: 18px;
  height: 18px;
  opacity: 1;
  vertical-align: middle;
  margin-right: 4px;
}

.bottom-right {
  right: 0;
}

.bottom-left {
  left: 0;
}

.legend-list {
  list-style: none;
  padding-top: 2px;
  padding-left: 2px;
  margin-left: 0;
  margin-bottom: 0;
}

.list-text {
  display: inline-block;
  vertical-align: middle;
}

</style>
