<script setup>

import { defineProps } from 'vue';

const $emit = defineEmits(['clickedCell', 'hoveredCell', 'unhoveredCell']);

defineProps({
  tableId: {
    type: String,
    default: 'vertical-table'
  },
  data: {
    type: Array,
    default: () => []
  },
  hoveredId: {
    type: String,
    default: ''
  },
});

</script>

<template>
  <table
    :id="tableId"
    class="table vert-table"
  >
    <tbody>
      <tr
        v-for="(field) in data"
        :key="field.label"
      >
        <th>{{ field.label }}</th>
        <td
          v-html="field.value"
          :class="hoveredId == field.class ? 'active-hover ' + field.class : 'inactive ' + field.class"
          @mouseenter="$emit('hoveredCell', field.class)"
          @mouseleave="$emit('unhoveredCell', field.class)"
          @click="$emit('clickedCell', field.label)"
        />
      </tr>
    </tbody>
  </table>
</template>

<style scoped>

table {
  border-collapse: separate;
  border-spacing: 2px;
  width: 100%;
  margin-bottom: .25rem !important;
}

th {
  background-color: rgb(68, 68, 68);
  color: white !important;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 6px;
  padding-bottom: 6px;
  width: 30%;
}

td {
  border: 1px !important;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 6px;
  padding-bottom: 6px;
  width: 70%;
  vertical-align: middle !important;
}

</style>