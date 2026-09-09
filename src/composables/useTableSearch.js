import { ref, watch } from 'vue';

// shared search-bar behavior for data tables: the TextFilter model, a visibility
// threshold, client-side row filtering, and a debounced hook for tables that
// search server-side (see LiStore's remote permits mode)
export default function useTableSearch({ fields = [], minRows = 50, debounceMs = 400, onSearch = null } = {}) {
  const searchTerm = ref('');

  // the bar only shows over tables big enough to need it; pass the UNFILTERED total
  const searchEnabled = (totalRows) => totalRows > minRows;

  const filterRows = (rows) => {
    if (!searchTerm.value || !rows) {
      return rows;
    }
    const term = searchTerm.value.toLowerCase();
    return rows.filter((row) => fields.some((field) => row[field] && String(row[field]).toLowerCase().includes(term)));
  };

  if (onSearch) {
    let timer = null;
    watch(searchTerm, () => {
      clearTimeout(timer);
      timer = setTimeout(() => onSearch(searchTerm.value), debounceMs);
    });
  }

  return { searchTerm, searchEnabled, filterRows };
}
