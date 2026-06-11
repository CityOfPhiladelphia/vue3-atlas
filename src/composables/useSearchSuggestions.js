import { ref, toValue, watch } from 'vue'

export function useSearchSuggestions(search) {
  const searchSuggestions = ref([])
  const searchSuggestionsError = ref(null)
  let skipNextFetch = false

  async function getSearchSuggestions(stringValue) {
    if (!stringValue || !/^(?:\d{1,5}(?:-\d{1,5})?[A-Za-z]{0,3} \w+)/.test(stringValue)) {
      searchSuggestions.value = []
      return
    }
    try {
      const response = await fetch(
        `https://0spy4bb9w1.execute-api.us-east-1.amazonaws.com/queryAis/autocomplete?q=${encodeURIComponent(stringValue)}&simple=true${import.meta.env.VITE_DEBUG ? `&client_id=${import.meta.env.VITE_AIS_CLIENTID_ATLAS}` : ''}`
      )
      if (!response.ok) {
        searchSuggestionsError.value = { status: response.status, message: response.body }
        return
      }
      searchSuggestions.value = await response.json()
    } catch (err) {
      searchSuggestionsError.value = err
    }
  }

  function dismissSuggestions() {
    skipNextFetch = true
    searchSuggestions.value = []
  }

  function hideSuggestions() {
    searchSuggestions.value = []
  }

  function refetchSuggestions() {
    getSearchSuggestions(toValue(search))
  }

  watch(
    () => toValue(search),
    (value) => {
      if (skipNextFetch) {
        skipNextFetch = false
        return
      }
      getSearchSuggestions(value)
    }
  )

  return {
    searchSuggestions,
    searchSuggestionsError,
    dismissSuggestions,
    hideSuggestions,
    refetchSuggestions,
  }
}
