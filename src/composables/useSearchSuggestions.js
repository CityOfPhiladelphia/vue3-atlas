import { ref, toValue, watch } from 'vue';
import { GATEWAY_CLIENT_ID } from '@/util/gateway.js';

// AIS autocomplete on the phila.gov API gateway, identified by the app's client id
const AIS_AUTOCOMPLETE_URL =
  'https://api-prod.phila.gov/ais-autocomplete/v1/autocomplete';
const CLIENT_ID_PARAM = GATEWAY_CLIENT_ID ? `&client_id=${GATEWAY_CLIENT_ID}` : '';

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
        `${AIS_AUTOCOMPLETE_URL}?q=${encodeURIComponent(stringValue)}${CLIENT_ID_PARAM}`
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
