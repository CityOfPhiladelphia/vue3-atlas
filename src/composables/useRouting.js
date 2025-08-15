import { useMainStore } from '@/stores/MainStore';

export default function useRouting() {
  const routeApp = (router, route) => {

    const MainStore = useMainStore();
    let startQuery = { ...route.query };
    delete startQuery['address'];
    delete startQuery['lat'];
    delete startQuery['lng'];
    if (import.meta.env.VITE_DEBUG) console.log('routeApp, router:', router, 'route:', route, 'startQuery:', startQuery);

    // MainStore has both address and topic
    if (MainStore.currentAddress && MainStore.currentTopic) {
      /* --DEBUG-- */ if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to address-and-topic because MainStore has address and topic');
      switch (MainStore.currentTopic) {
        case 'nearby-activity': {
          router.push({ name: 'address-topic-and-data', params: { address: MainStore.currentAddress, topic: MainStore.currentTopic, data: MainStore.currentNearbyActivityDataType || '311' }, query: { ...startQuery } });
          return;
        }
        case 'city-services': {
          router.push({ name: 'address-topic-and-data', params: { address: MainStore.currentAddress, topic: MainStore.currentTopic, data: MainStore.currentCityServicesDataType || 'public-schools' }, query: { ...startQuery } });
          return;
        }
        default: {
          router.push({ name: 'address-and-topic', params: { address: MainStore.currentAddress, topic: MainStore.currentTopic }, query: { ...startQuery } });
          return;
        }
      }
    }

    // MainStore only has address
    else if (MainStore.currentAddress) {
      /* --DEBUG-- */ if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to address because MainStore has address');
      router.push({ name: 'address', params: { address: MainStore.currentAddress }, query: { ...startQuery } });
      return;
    }

    // MainStore only has topic, and topic is 'voting'
    else if (MainStore.currentTopic == 'voting') {
      /* --DEBUG-- */ if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to topic because MainStore.currentTopic:', MainStore.currentTopic);
      if (MainStore.currentLang) {
        router.replace({ name: 'topic', params: { topic: MainStore.currentTopic }, query: { ...startQuery, 'lang': MainStore.currentLang } });
      } else {
        delete startQuery['lang'];
        router.replace({ name: 'topic', params: { topic: MainStore.currentTopic }, query: { ...startQuery } });
      }
      return;
    }

    // MainStore does not have an address topic is not 'voting'
    else {
      /* --DEBUG-- */ if (import.meta.env.VITE_DEBUG) console.log('routeApp routing to not-found because no address or topic');
      MainStore.addressSearchRunning = false;
      router.push({ name: 'not-found', query: { ...startQuery } });
      return;
    }
  }
  return {
    routeApp
  }
}
