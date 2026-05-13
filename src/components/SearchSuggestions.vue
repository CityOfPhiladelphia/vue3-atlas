<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  suggestions: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['select', 'dismiss']);

const activeIndex = ref(-1);
const listRef = ref(null);

watch(
  () => props.suggestions,
  () => {
    activeIndex.value = -1;
  }
);

function focusItem(index) {
  const items = listRef.value?.querySelectorAll('.search-suggestion');
  items?.[index]?.focus();
}

function focusFirst() {
  if (props.suggestions.length) {
    activeIndex.value = 0;
    focusItem(0);
  }
}

function handleKeydown(event) {
  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault();
      const next = Math.min(activeIndex.value + 1, props.suggestions.length - 1);
      activeIndex.value = next;
      focusItem(next);
      break;
    }
    case 'ArrowUp': {
      event.preventDefault();
      if (activeIndex.value <= 0) {
        activeIndex.value = -1;
        emit('dismiss');
      } else {
        activeIndex.value -= 1;
        focusItem(activeIndex.value);
      }
      break;
    }
    case 'Enter': {
      event.preventDefault();
      if (activeIndex.value >= 0) {
        emit('select', props.suggestions[activeIndex.value]);
      }
      break;
    }
    case 'Escape': {
      event.preventDefault();
      emit('dismiss');
      break;
    }
  }
}

defineExpose({ focusFirst });
</script>

<template>
  <div v-if="suggestions.length" class="search-suggestions-anchor">
    <ul
      ref="listRef"
      class="search-suggestions"
      role="listbox"
      @keydown="handleKeydown"
    >
      <li
        v-for="(suggestion, index) in suggestions"
        :key="suggestion"
        class="search-suggestion"
        :class="{ 'search-suggestion--active': index === activeIndex }"
        role="option"
        tabindex="-1"
        @click="emit('select', suggestion)"
      >
        {{ suggestion }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-suggestions-anchor {
  position: relative;
  width: 100%;
  height: 0;
}

.search-suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-height: 15rem;
  overflow-y: auto;
  z-index: 10;
}

.search-suggestion {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  color: #000;
  outline: none;
}

.search-suggestion:hover,
.search-suggestion:focus,
.search-suggestion--active {
  background-color: #f5f5f5;
}
</style>
