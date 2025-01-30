import { useMainStore } from '@/stores/MainStore';

export default function useRouting() {
  const routeApp = (router, route) => {
    
    const MainStore = useMainStore();
    let startQuery = { ...route.query };
    delete startQuery['address'];
    delete startQuery['lat'];
    delete startQuery['lng'];
    if (import.meta.env.VITE_DEBUG) console.log('routeApp, router:', router, 'route:', route, 'startQuery:', startQuery);
    if (!MainStore.currentAddress && MainStore.currentTopic == 'voting'){
      if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to topic because MainStore.currentTopic:', MainStore.currentTopic);
      if (MainStore.currentLang) {
        router.replace({ name: 'topic', params: { topic: MainStore.currentTopic }, query: { ...startQuery, 'lang': MainStore.currentLang } });
      } else {
        delete startQuery['lang'];
        router.replace({ name: 'topic', params: { topic: MainStore.currentTopic }, query: { ...startQuery } });
      }
    } else if (MainStore.currentAddress && MainStore.currentTopic == 'nearby') {
      if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to address-topic-and-data');
      router.push({ name: 'address-topic-and-data', params: { address: MainStore.currentAddress, topic: "nearby", data: MainStore.currentNearbyDataType || '311' }, query: { ...startQuery } });
    } else if (MainStore.currentAddress && MainStore.currentTopic) {
      if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to address-and-topic because MainStore has address and topic');
      router.push({ name: 'address-and-topic', params: { address: MainStore.currentAddress, topic: MainStore.currentTopic }, query: { ...startQuery } });
    } else if (MainStore.currentAddress) {
      if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to address because MainStore has address');
      router.push({ name: 'address', params: { address: MainStore.currentAddress }, query: { ...startQuery } });
    } else {
      if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to not-found because no address or topic');
      MainStore.addressSearchRunning = false;
      router.push({ name: 'not-found', query: { ...startQuery } });
    }
  }
  return {
    routeApp
  }
}