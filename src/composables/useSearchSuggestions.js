import { ref, toValue, watch } from 'vue';

// AIS autocomplete on the phila.gov API gateway, identified by the app's client id
const AIS_AUTOCOMPLETE_URL =
  'https://api-prod.phila.gov/ais-autocomplete/v1/autocomplete';
const GATEWAY_CLIENT_ID = import.meta.env.VITE_GATEWAY_CLIENT_ID;

export function useSearchSuggestions(search) {
  const searchSuggestions = ref([]);
  const searchSuggestionsError = ref(null);
  let skipNextFetch = false;

  async function getSearchSuggestions(stringValue) {
    if (!stringValue || stringValue.length < 3) {
      searchSuggestions.value = [];
      return;
    }

    try {
      const response = await fetch(
        `${AIS_AUTOCOMPLETE_URL}?q=${encodeURIComponent(stringValue)}&client_id=${GATEWAY_CLIENT_ID}`
      );
      if (!response.ok) {
        searchSuggestionsError.value = {
          status: response.status,
          message: response.statusText,
        };
        return;
      }
      const suggestions = await response.json();
      searchSuggestions.value = suggestions.count
        ? Array.from(suggestions.results.addresses, (suggestion) => suggestion.address)
        : [];
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
