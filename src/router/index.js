import { createRouter, createWebHistory } from 'vue-router';
import App from '@/App.vue';
import $config from '@/config';

import { useMainStore } from '@/stores/MainStore.js'
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import { useParcelsStore } from '@/stores/ParcelsStore.js'
import { useCondosStore } from '@/stores/CondosStore.js'
import { useOpaStore } from '@/stores/OpaStore.js'

import useRouting from '@/composables/useRouting';
const { routeApp } = useRouting();

// this runs on address search and as part of datafetch()
const clearStoreData = async() => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('clearStoreData is running');
  const OpaStore = useOpaStore();
  OpaStore.clearAllOpaData();

  const GeocodeStore = useGeocodeStore();
  GeocodeStore.aisDataChecked = {};

  const CondosStore = useCondosStore();
  CondosStore.lastPageUsed = 1;
  CondosStore.condosData.pages = { page_1: { features: [] } };
  CondosStore.condoUnits = { units: {} };
}

const getGeocodeAndPutInStore = async(address) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('getGeocodeAndPutInStore is running, address:', address);
  const GeocodeStore = useGeocodeStore();
  const MainStore = useMainStore();
  await GeocodeStore.fillAisData(address);
  console.log('test')
  if (MainStore.lastSearchMethod == 'address' && !GeocodeStore.aisData.features) {
    MainStore.currentAddress = null;
    if (import.meta.env.VITE_DEBUG == 'true') console.log('getGeocodeAndPutInStore, calling not-found');
    return;
  } else if (!Object.keys(GeocodeStore.aisData).length) {
    return;
  }
  console.log('test2')
  let currentAddress;
  if (GeocodeStore.aisData.properties.street_address) {
    currentAddress = GeocodeStore.aisData.properties.street_address;
  } else if (GeocodeStore.aisData.street_address) {
    currentAddress = GeocodeStore.aisData.street_address;
  }
  console.log('currentAddress:', currentAddress);
  MainStore.setCurrentAddress(currentAddress);
}

// this ONLY runs on map click
const getParcelsAndPutInStore = async(lng, lat) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('getParcelsAndPutInStore is running');
  const MainStore = useMainStore();
  const ParcelsStore = useParcelsStore();
  await ParcelsStore.checkParcelDataByLngLat(lng, lat, 'pwd');
  if (!Object.keys(ParcelsStore.pwdChecked).length) {
    return;
  }
  ParcelsStore.pwd = ParcelsStore.pwdChecked;
  const addressField = 'ADDRESS';
  const geocodeParameterField = 'BRT_ID';
  if (ParcelsStore.pwd.features) {
    MainStore.currentParcelAddress = ParcelsStore.pwd.features[0].properties[addressField];
    MainStore.currentParcelGeocodeParameter = ParcelsStore.pwd.features[0].properties[geocodeParameterField]
  }
}

// it should only show an address at the top that has been found in AIS for the top line address, so, if map clicked, it
// goes through all of the clicked parcel info, running it against AIS until it gets a match
const checkParcelInAis = async() => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('checkParcelInAis starting');
  const GeocodeStore = useGeocodeStore();
  const MainStore = useMainStore();
  await GeocodeStore.checkAisData(MainStore.currentParcelGeocodeParameter);
  if (GeocodeStore.aisDataChecked.features) {
    MainStore.currentAddress = GeocodeStore.aisDataChecked.features[0].properties.street_address;
  } else {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('checkParcelInAis, noAisData currentParcelGeocodeParameter');
    await GeocodeStore.checkAisData(MainStore.otherParcelGeocodeParameter);
    if (GeocodeStore.aisDataChecked.features) {
      MainStore.currentAddress = GeocodeStore.aisDataChecked.features[0].properties.street_address;
    } else {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('checkParcelInAis, noAisData otherParcelGeocodeParameter');
      await GeocodeStore.checkAisData(MainStore.currentParcelAddress);
      if (GeocodeStore.aisDataChecked.features) {
        MainStore.currentAddress = GeocodeStore.aisDataChecked.features[0].properties.street_address;
      } else {
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('checkParcelInAis, noAisData currentParcelAddress');
        await GeocodeStore.checkAisData(MainStore.otherParcelAddress);
        if (GeocodeStore.aisDataChecked.features) {
          MainStore.currentAddress = GeocodeStore.aisDataChecked.features[0].properties.street_address;
        } else {
          // if (import.meta.env.VITE_DEBUG == 'true') console.log('checkParcelInAis, noAisData otherParcelAddress');
        }
      }
    }
  }
}

// this is called on every route change, including address searches, initial app load, and back button clicks
// when it is called, it may have some of the data it needs already in the store (after a geocode), or it may need to fetch everything (e.g. initial app load)
const dataFetch = async(to, from) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('dataFetch is starting, to:', to, 'from:', from, 'to.params.address:', to.params.address, 'from.params.address:', from.params.address);
  const MainStore = useMainStore();
  MainStore.datafetchRunning = true;
  const GeocodeStore = useGeocodeStore();
  const ParcelsStore = useParcelsStore();
  // const dataSourcesLoadedArray = MainStore.dataSourcesLoadedArray;
  if (to.name === 'not-found') {
    MainStore.datafetchRunning = false;
    return;
  }

  let opaNum;
  if (to.query.p != "") { opaNum = to.query.p }

  if (import.meta.env.VITE_DEBUG == 'true') console.log('to.params.address:', to.params.address, 'from.params.address:', from.params.address, 'GeocodeStore.aisData.normalized:', GeocodeStore.aisData.normalized);
  
  let routeAddressChanged;
  if (from.params.address) {
    routeAddressChanged = to.params.address.trim() !== from.params.address.trim();
  } else {
    routeAddressChanged = to.params.address !== from.params.address;
  }

  let routeOpaChanged = to.query.p !== from.query.p;
  if (import.meta.env.VITE_DEBUG == 'true') console.log('routeOpaChanged:', routeOpaChanged);

  // In the config, there is a list called "addressDoubles" of addresses we know of that are used by multiple properties.
  // An exception has to be made for them, in the case that someone clicks from one of them to the other.
  // if ($config.addressDoubles.includes(address) || routeOpaChanged) {
  if (routeOpaChanged && to.query.p) {
    // if there is no geocode or the geocode does not match the address in the route, get the geocode
    if (import.meta.env.VITE_DEBUG) console.log('GeocodeStore.aisData.normalized:', GeocodeStore.aisData.normalized);
    if (!GeocodeStore.aisData.normalized || GeocodeStore.aisData.normalized && GeocodeStore.aisData.normalized !== opaNum) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('in datafetch, routeOpaChanged:', routeOpaChanged, 'right before geocode, GeocodeStore.aisData:', GeocodeStore.aisData);
      await clearStoreData();
      await getGeocodeAndPutInStore(opaNum);
    }
    if (import.meta.env.VITE_DEBUG == 'true') console.log('in datafetch, after geocode, GeocodeStore.aisData:', GeocodeStore.aisData);

    // if this was NOT started by a map click, get the parcels
    if (MainStore.lastSearchMethod !== 'mapClick') {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('dataFetch, inside if');
      await ParcelsStore.fillPwdParcelData();
    }
  } else if (routeAddressChanged && to.query.address) {
    // if there is no geocode or the geocode does not match the address in the route, get the geocode
    if (import.meta.env.VITE_DEBUG) console.log('GeocodeStore.aisData.normalized:', GeocodeStore.aisData.normalized);
    if (!GeocodeStore.aisData.normalized || GeocodeStore.aisData.normalized && GeocodeStore.aisData.normalized !== opaNum) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('in datafetch, routeOpaChanged:', routeOpaChanged, 'right before geocode, GeocodeStore.aisData:', GeocodeStore.aisData);
      await clearStoreData();
      await getGeocodeAndPutInStore(to.query.address);
    }
    if (import.meta.env.VITE_DEBUG == 'true') console.log('in datafetch, after geocode, GeocodeStore.aisData:', GeocodeStore.aisData);

    // if this was NOT started by a map click, get the parcels
    if (MainStore.lastSearchMethod !== 'mapClick') {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('dataFetch, inside if');
      await ParcelsStore.fillPwdParcelData();
    }
  }
  
  // check for condos
  // const CondosStore = useCondosStore();
  // CondosStore.loadingCondosData = true;
  // await CondosStore.fillCondoData(MainStore.currentAddress);
  // CondosStore.loadingCondosData = false;

  const OpaStore = useOpaStore();
  await OpaStore.fillOpaPublic();
  await OpaStore.fillOpaAssessment();
  await OpaStore.fillActiveSearchAssessmentHistory();
  await OpaStore.fillActiveSearchSalesHistory();
  // if (import.meta.env.VITE_VERSION == 'cityatlas') {
  //   await OpaStore.fillAssessmentHistory();
  // }
  OpaStore.loadingOpaData = false;

  // MainStore.lastSearchMethod = null;
  MainStore.datafetchRunning = false;
}

const router = createRouter({
  // history: createWebHashHistory(import.meta.env.BASE_URL),
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   path: '/:pathMatch(.*)*',
    //   name: 'NotFound',
    //   component: () => import('@/components/NotFound.vue')
    // },
    {
      path: '/',
      name: 'home',
      component: App,
      props: true,
    },
    {
      path: '/search',
      name: 'search',
      component: App,
      beforeEnter: async (to, from) => {
        const { address, p, lat, lng } = to.query;
        if (import.meta.env.VITE_DEBUG == 'true') console.log('search route beforeEnter, to.query:', to.query, 'from:', from, 'p:', p);
        const MainStore = useMainStore();
        const GeocodeStore = useGeocodeStore();
        const ParcelsStore = useParcelsStore();
        MainStore.addressSearchRunning = true;
        if (MainStore.datafetchRunning) {
          return false;
        } else if (address && address !== '') {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('search route beforeEnter, address:', address);
          MainStore.setLastSearchMethod('geocode');
          await clearStoreData();
          await getGeocodeAndPutInStore(address);
          routeApp(router, to);
        } else if (p && p !== '') {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('search route beforeEnter, p:', p);
          MainStore.setLastSearchMethod('geocode');
          await clearStoreData();
          await getGeocodeAndPutInStore(p);
          routeApp(router, to);
        } else if (lat && lng) {
          MainStore.setLastSearchMethod('reverseGeocode');
          await getParcelsAndPutInStore(lng, lat);
          if (!Object.keys(ParcelsStore.pwdChecked).length && !Object.keys(ParcelsStore.dorChecked).length) {
            MainStore.addressSearchRunning = false;
            return false;
          }
          GeocodeStore.aisData = {};
          await checkParcelInAis();
          routeApp(router, to);
        } else {
          return false;
        }
      },
    }
  ],
});

router.afterEach(async (to, from) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('router afterEach to:', to, 'from:', from);
  const MainStore = useMainStore();
  if (to.query.lang !== from.query.lang) {
    MainStore.currentLang = to.query.lang;
  }
  if (to.name !== 'not-found' && to.name !== 'search') {
    MainStore.addressSearchRunning = false;
    await dataFetch(to, from);
    let pageTitle = MainStore.appVersion;
    for (let param of Object.keys(to.params)) {
      pageTitle += ' | ' + to.params[param];
    }
    MainStore.pageTitle = pageTitle;
  } else if (to.name == 'not-found') {
    MainStore.currentAddress = null;
    MainStore.currentParcelGeocodeParameter = null;
    MainStore.currentParcelAddress = null;
    MainStore.otherParcelAddress = null;
    MainStore.otherParcelGeocodeParameter = null;
  }
});

export default router;
// export { dataFetch };
