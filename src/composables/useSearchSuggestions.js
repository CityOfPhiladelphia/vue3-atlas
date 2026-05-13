import { ref, toValue, watch } from 'vue';

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
        `https://ais-autocomplete.citygeo.phila.city/autocomplete?q=${stringValue.replace(/ /, '+')}`
      );
      const suggestions = await response.json();
      const suggestedAddresses = suggestions.count
        ? Array.from(
            suggestions.results.addresses,
            (suggestion) => suggestion.address
          )
        : [];
      searchSuggestions.value = suggestedAddresses;
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
