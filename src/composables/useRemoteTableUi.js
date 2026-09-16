import { ref, watch } from 'vue';

// component-side wiring for a store's remote table mode: current-page state, row
// loading, and the vue-good-table event handlers. Pairs with useTableSearch for the
// search bar and with a store's *UiPage/set*Sort actions (see LiStore permits/licenses).
// NOTE vue-good-table-next emits page-change/per-page-change/sort-change (no on- prefix).
export default function useRemoteTableUi({ isRemote, resetKey, fetchUiPage, setSort, perPageDefault = 5, onReset = null }) {
  const currentPage = ref(1);
  const perPage = ref(perPageDefault);
  const rows = ref([]);

  const load = async () => {
    rows.value = await fetchUiPage(currentPage.value, perPage.value);
  };

  // a new address (resetKey) or a flip into remote mode starts from a clean page 1
  watch(() => [ isRemote(), resetKey() ], () => {
    if (onReset) {
      onReset();
    }
    if (isRemote()) {
      currentPage.value = 1;
      load();
    }
  }, { immediate: true });

  const onPageChange = (params) => {
    if (!isRemote()) return;
    currentPage.value = params.currentPage;
    if (params.currentPerPage) {
      perPage.value = params.currentPerPage;
    }
    load();
  };
  const onPerPageChange = (params) => {
    if (!isRemote()) return;
    perPage.value = params.currentPerPage;
    currentPage.value = 1;
    load();
  };
  const onSortChange = async (params) => {
    if (!isRemote()) return;
    await setSort(params[0].field, params[0].type);
    currentPage.value = 1;
    load();
  };

  return { rows, currentPage, perPage, load, onPageChange, onPerPageChange, onSortChange };
}
