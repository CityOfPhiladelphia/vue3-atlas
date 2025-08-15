import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App.vue';
import $config from '@/config';

import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useCondosStore } from '@/stores/CondosStore.js'
import { useParcelsStore } from '@/stores/ParcelsStore.js'
import { useOpaStore } from '@/stores/OpaStore.js'
import { useLiStore } from '@/stores/LiStore.js'
import { useDorStore } from '@/stores/DorStore.js'
import { useZoningStore } from '@/stores/ZoningStore.js'
import { useVotingStore } from '@/stores/VotingStore.js'
import { useCity311Store } from '@/stores/City311Store.js'
import { useStormwaterStore } from '@/stores/StormwaterStore.js'
import { useNearbyActivityStore } from '@/stores/NearbyActivityStore.js'
import { useCityServicesStore } from '@/stores/CityServicesStore.js'
import { useMainStore } from '@/stores/MainStore.js'
import useRouting from '@/composables/useRouting';
const { routeApp } = useRouting();

// this runs on address search and as part of datafetch()
const clearStoreData = async() => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('clearStoreData is running');
  const MainStore = useMainStore();
  MainStore.clearDataSourcesLoadedArray();
  const OpaStore = useOpaStore();
  OpaStore.clearAllOpaData();
  const DorStore = useDorStore();
  DorStore.clearAllDorData();
  const LiStore = useLiStore();
  LiStore.clearAllLiData();
  const ZoningStore = useZoningStore();
  ZoningStore.clearAllZoningData();
  const VotingStore = useVotingStore();
  VotingStore.clearAllVotingData();
  const StormwaterStore = useStormwaterStore();
  StormwaterStore.clearAllStormwaterData();
  const NearbyActivityStore = useNearbyActivityStore();
  NearbyActivityStore.clearAllNearbyActivityData();
  const CityServicesStore = useCityServicesStore();
  CityServicesStore.clearAllCityServicesData();
  const CondosStore = useCondosStore();
  CondosStore.lastPageUsed = 1;
  CondosStore.condosData.pages = { page_1: { features: [] } };
}

const getGeocodeAndPutInStore = async(address) => {
  const GeocodeStore = useGeocodeStore();
  const MainStore = useMainStore();
  await GeocodeStore.fillAisData(address);
  if (MainStore.lastSearchMethod == 'address' && !GeocodeStore.aisData.features) {
    MainStore.currentAddress = null;
    if (import.meta.env.VITE_DEBUG == 'true') console.log('getGeocodeAndPutInStore, calling not-found');
    // router.push({ name: 'not-found' });
    return;
  } else if (!GeocodeStore.aisData.features) {
    return;
  }
  let currentAddress;
  if (GeocodeStore.aisData.features[0].properties.street_address) {
    currentAddress = GeocodeStore.aisData.features[0].properties.street_address;
  } else if (GeocodeStore.aisData.features[0].street_address) {
    currentAddress = GeocodeStore.aisData.features[0].street_address;
  }
  MainStore.setCurrentAddress(currentAddress);
  // MainStore.addressSearchRunning = false;
}

// this ONLY runs on map click
const getParcelsAndPutInStore = async(lng, lat) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('getParcelsAndPutInStore is running');
  const MainStore = useMainStore();
  let currentTopic = MainStore.currentTopic;
  const parcelLayer = $config.parcelLayerForTopic[currentTopic] || 'pwd';
  const ParcelsStore = useParcelsStore();
  await ParcelsStore.checkParcelDataByLngLat(lng, lat, 'pwd');
  await ParcelsStore.checkParcelDataByLngLat(lng, lat, 'dor');
  if (parcelLayer === 'dor' && !Object.keys(ParcelsStore.dorChecked).length) {
    return;
  } else if (parcelLayer === 'pwd' && !Object.keys(ParcelsStore.pwdChecked).length) {
    return;
  }
  ParcelsStore.pwd = ParcelsStore.pwdChecked;
  ParcelsStore.dor = ParcelsStore.dorChecked;

  // collects 4 things to attempt to geocode from the parcels clicked
  const otherParcelLayer = parcelLayer === 'pwd' ? 'dor' : 'pwd';
  const addressField = parcelLayer === 'pwd' ? 'ADDRESS' : 'ADDR_SOURCE';
  const otherAddressField = otherParcelLayer === 'pwd' ? 'ADDRESS' : 'ADDR_SOURCE';
  const geocodeParameterField = parcelLayer === 'pwd' ? 'PARCELID' : 'mapreg';
  const otherGeocodeParameterField = otherParcelLayer === 'pwd' ? 'PARCELID' : 'mapreg';

  // if (import.meta.env.VITE_DEBUG == 'true') console.log('parcelLayer:', parcelLayer);
  if (ParcelsStore[parcelLayer].features) {
    MainStore.currentParcelAddress = ParcelsStore[parcelLayer].features[0].properties[addressField];
    MainStore.currentParcelGeocodeParameter = ParcelsStore[parcelLayer].features[0].properties[geocodeParameterField]
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('ParcelsStore[parcelLayer].features[i].properties[geocodeParameterField]:', ParcelsStore[parcelLayer].features[0].properties[geocodeParameterField], 'ParcelsStore[parcelLayer].features[i].properties[otherGeocodeParameterField]:', ParcelsStore[parcelLayer].features[0].properties[otherGeocodeParameterField]);
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('MainStore.currentParcelAddress:', MainStore.currentParcelAddress);
  }
  if (ParcelsStore[otherParcelLayer].features) {
    MainStore.otherParcelAddress = ParcelsStore[otherParcelLayer].features[0].properties[otherAddressField];
    MainStore.otherParcelGeocodeParameter = ParcelsStore[otherParcelLayer].features[0].properties[otherGeocodeParameterField]
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('else MainStore.otherParcelAddress:', MainStore.otherParcelAddress);
  }
  // MainStore.addressSearchRunning = false;
}

// it should only show an address at the top that has been found in AIS for the top line address, so, if map clicked, it
// goes through all of the clicked parcel info, running it against AIS until it gets a match
const checkParcelInAis = async() => {
  const GeocodeStore = useGeocodeStore();
  const MainStore = useMainStore();
  const parcelData = [
    MainStore.currentParcelGeocodeParameter,
    MainStore.otherParcelGeocodeParameter,
    MainStore.currentParcelAddress,
    MainStore.otherParcelAddress
  ];

  // loop through parcels' geocodes and addresses and check each in AIS, return on first the AIS match
  for (const item of parcelData) {
    await GeocodeStore.checkAisData(item);
    if (GeocodeStore.aisDataChecked.features) {
      MainStore.currentAddress = GeocodeStore.aisDataChecked.features[0].properties.street_address;
      return;
    }
  }
}

// this is called on every route change, including address searches, topic changes, initial app load, and back button clicks
// when it is called, it may have some of the data it needs already in the store (after a geocode), or it may need to fetch everything (e.g. initial app load)
const dataFetch = async(to, from) => {
  // exit dataFetch is route is 'not-found'
  if (to.name === 'not-found') {
    MainStore.datafetchRunning = false;
    return;
  }

  if (import.meta.env.VITE_DEBUG == 'true') console.log('dataFetch is starting, to:', to, 'from:', from, 'to.params.address:', to.params.address, 'from.params.address:', from.params.address, 'to.params.topic:', to.params.topic, 'from.params.topic:', from.params.topic);
  const MainStore = useMainStore();
  MainStore.datafetchRunning = true;
  const GeocodeStore = useGeocodeStore();
  const ParcelsStore = useParcelsStore();
  const dataSourcesLoadedArray = MainStore.dataSourcesLoadedArray;

   // if to.params.address or to.query.address, set address to to.params.address or to.query.address, otherwise null
  const address = to.params.address ? to.params.address : (to.query.address ? to.query.address : null);
  const topic = to.params.topic ? to.params.topic.toLowerCase() : null;

  // set main store's current topic
  if (to.name === 'address') {
    MainStore.currentTopic = '';
  } else if (!MainStore.currentTopic && topic) {
    MainStore.currentTopic = topic;
  }

  // check if trimmed addresses are the same, or if both are null
  if (import.meta.env.VITE_DEBUG == 'true') console.log('address:', address, 'to.params.address:', to.params.address, 'from.params.address:', from.params.address, 'GeocodeStore.aisData.normalized:', GeocodeStore.aisData.normalized);
  const routeAddressChanged = from.params.address ? (to.params.address.trim() !== from.params.address.trim()) : (to.params.address !== from.params.address);

  // In the config, there is a list called "addressDoubles" of addresses we know of that are used by multiple properties.
  // An exception has to be made for them, in the case that someone clicks from one of them to the other.
  if (routeAddressChanged || $config.addressDoubles.includes(address)) {
    // if there is no geocode or the geocode does not match the address in the route, get the geocode
    if (!GeocodeStore.aisData.normalized || (GeocodeStore.aisData.normalized && GeocodeStore.aisData.normalized !== address)) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('in datafetch, routeAddressChanged:', routeAddressChanged, 'right before geocode, GeocodeStore.aisData:', GeocodeStore.aisData);
      await clearStoreData();
      if (GeocodeStore.aisDataChecked.features) {
        GeocodeStore.aisData = GeocodeStore.aisDataChecked;
        GeocodeStore.aisDataChecked = {};
      } else {
        await getGeocodeAndPutInStore(address);
      }
    }
    if (import.meta.env.VITE_DEBUG == 'true') console.log('in datafetch, after geocode, GeocodeStore.aisData:', GeocodeStore.aisData);

    // if this was NOT started by a map click, get the parcels
    if (MainStore.lastSearchMethod !== 'mapClick') {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('dataFetch, inside if routeAddressChanged:', routeAddressChanged);
      await ParcelsStore.fillPwdParcelData();
      await ParcelsStore.fillDorParcelData();
    }
  }

  else if (dataSourcesLoadedArray.includes(to.params.data)) {
    if (topic === 'nearby-activity') {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('dataFetch is still going, MainStore.currentNearbyActivityDataType:', MainStore.currentNearbyActivityDataType, 'to.params.data:', to.params.data);
      MainStore.currentNearbyActivityDataType = to.params.data;
      MainStore.datafetchRunning = false;
      return;
    }
    if (topic === 'city-services') {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('dataFetch is still going, MainStore.currentCityServicesDataType:', MainStore.currentCityServicesDataType, 'to.params.data:', to.params.data);
      MainStore.currentCityServicesDataType = to.params.data;
      MainStore.datafetchRunning = false;
      return;
    }
  }

  // if topic is not 'nearby-activity' or 'city-services' and data scources already includes topic
  else if (dataSourcesLoadedArray.includes(topic) && topic !== 'nearby-activity' && topic !== 'city-services') {
    MainStore.datafetchRunning = false;
    return;
  }

  // check for condos
  const CondosStore = useCondosStore();
  CondosStore.loadingCondosData = true;
  await CondosStore.fillCondoData(address);
  CondosStore.loadingCondosData = false;

  // if the topic is condos and the address changes and there are no condos, reroute to property
  if (to.params.topic == "condos" && !CondosStore.condosData.pages.page_1.features.length) {
    MainStore.currentTopic = "property";
    router.push({ name: 'address-and-topic', params: { address: to.params.address, topic: 'property' } });
    MainStore.datafetchRunning = false;
    return;
  }

  MainStore.lastSearchMethod = null;
  MainStore.datafetchRunning = false;

  await topicDataFetch(to.params.topic, to.params.data);
  if (to.params.topic !== 'nearby-activity') {
    MainStore.addToDataSourcesLoadedArray(to.params.topic);
  } else {
    if (!MainStore.dataSourcesLoadedArray.includes('nearby-activity')) {
      MainStore.addToDataSourcesLoadedArray('nearby-activity');
    }
    MainStore.addToDataSourcesLoadedArray(MainStore.currentNearbyActivityDataType);
  }
}

const topicDataFetch = async (topic, data) => {
  switch (topic) {
    case 'property': {
      const OpaStore = useOpaStore();
      await OpaStore.fillOpaData();
      if (import.meta.env.VITE_VERSION == 'cityatlas') {
        await OpaStore.fillAssessmentHistory();
      }
      OpaStore.loadingOpaData = false;
      return;
    }
    case 'li': {
      const LiStore = useLiStore();
      await LiStore.fillAllLiData();
      LiStore.loadingLiData = false;
      return;
    }
    case 'deeds': {
      const DorStore = useDorStore();
      await Promise.all([DorStore.fillDorDocuments(),
      DorStore.fillRegmaps(),
      DorStore.fillDorCondos()
      ]);
      DorStore.loadingDorData = false;
      return;
    }
    case 'zoning': {
      const ZoningStore = useZoningStore();
      await ZoningStore.fillAllZoningData();
      ZoningStore.loadingZoningData = false;
      return;
    }
    case 'voting': {
      const VotingStore = useVotingStore();
      await VotingStore.fillAllVotingData();
      VotingStore.loadingVotingData = false;
      return;
    }
    case 'city311': {
      const City311Store = useCity311Store();
      if (!City311Store.agoToken) {
        await City311Store.getAgoToken();
      }
      await City311Store.fillCity311(data);
      return;
    }
    case 'stormwater': {
      const StormwaterStore = useStormwaterStore();
      await StormwaterStore.fillStormwaterData();
      StormwaterStore.loadingStormwaterData = false;
      return;
    }
    case 'nearby-activity': {
      const NearbyActivityStore = useNearbyActivityStore();
      await NearbyActivityStore.fetchData(data);
      return;
    }
    case 'city-services': {
      const CityServicesStore = useCityServicesStore();
      await CityServicesStore.fetchData(data);
      return;
    }
    default: {
      return;
    }
  }
}

const router = createRouter({
  // history: createWebHashHistory(import.meta.env.BASE_URL),
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/components/NotFound.vue')
    },
    {
      path: '/',
      name: 'home',
      component: App,
      props: true,
    },
    {
      path: '/:addressOrTopic',
      name: 'address-or-topic',
      component: App,
      beforeEnter: async (to, from) => {
        if (import.meta.env.VITE_DEBUG === 'true') console.log('address-or-topic route beforeEnter, to:', to, 'from:', from, to.params.addressOrTopic.toLowerCase());
        const MainStore = useMainStore();
        const topics = [ 'voting' ];
        if (topics.includes(to.params.addressOrTopic.toLowerCase())) {
          if (import.meta.env.VITE_DEBUG === 'true') console.log('inside if, routing to topic');
          MainStore.currentTopic = to.params.addressOrTopic;
          MainStore.currentAddress = null;
          MainStore.currentLang = to.query.lang;
          routeApp(router, to);
        } else {
          if (import.meta.env.VITE_DEBUG === 'true') console.log('inside else, routing to address');
          MainStore.currentTopic = null;
          MainStore.currentAddress = to.params.addressOrTopic;
          MainStore.currentLang = to.query.lang;
          routeApp(router, to);
        }
      }
    },
    {
      path: '/:address',
      name: 'address',
      component: App,
    },
    {
      path: '/:topic',
      name: 'topic',
      component: App,
      beforeEnter: async (to, from) => {
        console.log('topic route beforeEnter, to:', to, 'from:', from);
      }
    },
    {
      path: '/:address/:topic',
      name: 'address-and-topic',
      component: App,
    },
    {
      path: '/:address/:topic/:data',
      name: 'address-topic-and-data',
      component: App,
    },
    {
      path: '/not-found',
      name: 'not-found',
      component: App,
    },
    {
      path: '/search',
      name: 'search',
      component: App,
      beforeEnter: async (to, from) => {
        const { address, lat, lng } = to.query;
        if (import.meta.env.VITE_DEBUG == 'true') console.log('search route beforeEnter, to.query:', to.query, 'from:', from, 'address:', address);
        const MainStore = useMainStore();
        const GeocodeStore = useGeocodeStore();
        const ParcelsStore = useParcelsStore();
        MainStore.addressSearchRunning = true;
        if (MainStore.datafetchRunning) {
          return false;
        } else if (address) {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('search route beforeEnter, address:', address);
          MainStore.setLastSearchMethod('address');
          await clearStoreData();
          await getGeocodeAndPutInStore(address);
          if (!GeocodeStore.aisData.features) {
            MainStore.currentTopic = null;
          }
          routeApp(router, to);
        } else if (lat && lng) {
          MainStore.setLastSearchMethod('mapClick');
          await getParcelsAndPutInStore(lng, lat);
          if (!Object.keys(ParcelsStore.pwdChecked).length && !Object.keys(ParcelsStore.dorChecked).length) {
            MainStore.addressSearchRunning = false;
            return false;
          }
          await checkParcelInAis();
          routeApp(router, to);
        } else {
          MainStore.addressSearchRunning = false;
          return false;
        }
      },
    }
  ]
})

router.afterEach(async (to, from) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('router afterEach to:', to, 'from:', from);
  const MainStore = useMainStore();
  if (to.query.lang !== from.query.lang) {
    MainStore.currentLang = to.query.lang;
  }
  if (to.name === 'address-or-topic') {
    return;
  } else if (to.name !== 'not-found' && to.name !== 'search') {
    MainStore.addressSearchRunning = false;
    await dataFetch(to, from);
    // let pageTitle = MainStore.appVersion + '.phila.gov';
    let pageTitle = MainStore.appVersion.charAt(0).toUpperCase() + MainStore.appVersion.slice(1);
    for (let param of Object.keys(to.params)) {
      pageTitle += ' | ' + to.params[param];
    }
    MainStore.pageTitle = pageTitle;
  } else if (to.name == 'not-found') {
    MainStore.currentTopic = "property"
    MainStore.currentAddress = null;
    MainStore.currentParcelGeocodeParameter = null;
    MainStore.currentParcelAddress = null;
    MainStore.otherParcelAddress = null;
    MainStore.otherParcelGeocodeParameter = null;
  }
});

export default router
