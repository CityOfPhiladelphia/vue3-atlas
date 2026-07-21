import { ref, toValue, watch } from 'vue';

const AIS_AUTOCOMPLETE_URL =
  'https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAis/autocomplete';

export function useSearchSuggestions(search) {
  const searchSuggestions = ref([]);
  const searchSuggestionsError = ref(null);
  let skipNextFetch = false;

  async function getSearchSuggestions(stringValue) {
    if (!stringValue || stringValue.length < 3) {
      searchSuggestions.value = [];
      return;
    }

    // the proxy identifies callers by origin, which localhost is not registered as
    const clientId =
      import.meta.env.VITE_DEBUG == 'true'
        ? `&client_id=${import.meta.env.VITE_AIS_CLIENTID_ATLAS}`
        : '';

    try {
      const response = await fetch(
        `${AIS_AUTOCOMPLETE_URL}?q=${encodeURIComponent(stringValue)}&simple=true${clientId}`
      );
      if (!response.ok) {
        searchSuggestionsError.value = {
          status: response.status,
          message: response.statusText,
        };
        return;
      }
      searchSuggestions.value = await response.json();
    } catch (err) {
      searchSuggestionsError.value = err;
    }
  }

  function dismissSuggestions() {
    skipNextFetch = true;
    searchSuggestions.value = [];
  }

  function hideSuggestions() {
    searchSuggestions.value = [];
  }

  function refetchSuggestions() {
    getSearchSuggestions(toValue(search));
  }

  watch(
    () => toValue(search),
    (value) => {
      if (skipNextFetch) {
        skipNextFetch = false;
        return;
      }
      getSearchSuggestions(value);
    }
  );

  return {
    searchSuggestions,
    searchSuggestionsError,
    dismissSuggestions,
    hideSuggestions,
    refetchSuggestions,
  };
}
