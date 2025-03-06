
import { defineStore, acceptHMRUpdate } from 'pinia';

import isMobileDevice from '../util/is-mobile-device';

export const useMainStore = defineStore("MainStore", {
  state: () => {
    return {
      condoSearched: false,
      addressSearchRunning: false,
      datafetchRunning: false,
      publicPath: null,
      isMobileDevice: null,
      isMac: null,
      lastSearchMethod: 'geocode',
      // lastSearchMethod: 'address',
      addressSearchValue: '',
      lastClickCoords: [0,0],
      currentParcelGeocodeParameter: '',
      // otherParcelGeocodeParameter: '',
      currentParcelAddress:'',
      // otherParcelAddress:'',
      currentAddress: '',
      currentLang: null,
      currentNearbyDataType: null,
      currentNearbyTimeInterval: {},
      dataSourcesLoadedArray: [],
      clickedRow: [],
      clickedMarkerId: null,
      hoveredStateId: null,
      selectedParcelId: null,
      fullScreenMapEnabled: false,
      fullScreenDataEnabled: false,
      windowDimensions: {},


      isLarge: null,
      loadingData: false,
      activeAddressKnown: false,
      isMobileOrTablet: isMobileDevice(),
      leftPanel: true,
      ownerSearchModal: false,
      mapViewWasSetOnAppLoad: false,
      fullScreen: {
        mapOnly: false,
        topicsOnly: false,
      },
      candidates: [],
      addressEntered: null,
      parcels: {},
      sources: {},
      activeSearch: null,
      horizontalTables: {
        // table id => filtered rows
        filteredData: {},
        mouseover: false,
      },
      // horizontalTableGroups: createHorizontalTableGroups(config),
      activeFeature: {
        featureId: null,
        tableId: null,
      },
      activeModalFeature: null,
      activeModal: {
        featureId: null,
      },
      // activeCondo: {
      //   featureId: null,
      // },
      appData: {
        propertyBalance: 0,
      },
      modals: {
        // keys: config.modals,
        open: '',
      },
      map: {},
    };
  },

  actions: {
    setCurrentAddress(address) {
      this.currentAddress = address;
    },
    setCurrentGeocodeParameter(value) {
      this.currentGeocodeParameter = value;
    },
    setLastSearchMethod(searchMethod) {
      this.lastSearchMethod = searchMethod;
    },
    setCurrentNearbyDataType(data) {
      this.currentNearbyDataType = data;
    },
    clearDataSourcesLoadedArray() {
      this.dataSourcesLoadedArray = [];
    },
    addToDataSourcesLoadedArray(data) {
      this.dataSourcesLoadedArray.push(data);
    },

    setIsLarge(payload) {
      this.isLarge = payload;
    },
    setLoadingData(payload) {
      this.loadingData = payload;
    },
    setActiveAddressKnown(payload) {
      this.activeAddressKnown = payload;
    },
    setLeftPanel(payload) {
      this.leftPanel = payload;
    },
    setOwnerSearchModal(payload){
      this.ownerSearchModal = payload;
    },
    setMapViewWasSetOnAppLoad(payload) {
      this.mapViewWasSetOnAppLoad = payload;
    },
    setCandidates(payload) {
      this.candidates = payload;
    },
    setAddressEntered(payload) {
      this.addressEntered = payload;
    },
    setIsMobileOrTablet(payload) {
      this.isMobileOrTablet = payload;
    },
    setMapOnly(payload) {
      this.fullScreen.mapOnly = payload;
    },
    setTopicsOnly(payload) {
      this.fullScreen.topicsOnly = payload;
    },
    setFullScreenMapEnabled(payload) {
      this.fullScreenMapEnabled = payload;
    },
    setfullScreenDataEnabled(payload) {
      this.fullScreenDataEnabled = payload;
    },
    setLocation(payload) {
      this.this.this.map.location.lat = payload.lat;
      this.this.this.map.location.lng = payload.lng;
    },
    setWatchPositionOn(payload) {
      this.this.this.map.watchPositionOn = payload;
    },
    setHorizontalTableGroupActiveTable(payload) {
      // console.log('setHorizontalTableGroupActiveTable, payload:', payload);
      this.this.this.horizontalTableGroups[payload.tableGroupId].activeTableId = payload.activeTableId;
      this.this.this.horizontalTableGroups[payload.tableGroupId].activeTable = payload.activeTable;
    },
    setHorizontalTableFilteredData(payload) {
      const { tableId, data } = payload;

      // check for not-null table id
      if (!tableId) {
        return;
      }
      this.this.horizontalTables.filteredData[tableId] = data;
    },
    setHorizontalTableMouseover(payload) {
      // this.this.horizontalTables.mouseover = payload;
    },
    setMapFilters(payload) {
      this.this.map.filters = payload;
    },

    setMap(payload) {
      this.this.map.map = payload.map;
    },
    setMapBounds(payload) {
      console.log('PDE store.js setMapBounds is running');
      this.map.bounds = payload;
    },
    setMapBoundsBasedOnShape(payload) {
      this.map.boundsBasedOnShape = payload;
    },
    setActiveFeature(payload) {
      const { featureId, tableId } = payload || {};
      const nextActiveFeature = { featureId, tableId };
      this.activeFeature = nextActiveFeature;
    },
    setActiveModal(payload) {
      // console.log('store.js setActiveModal is running, payload:', payload);
      const { featureId } = payload || {};
      const nextActiveFeature = { featureId };
      this.activeModal = nextActiveFeature;
    },
    setActiveModalFeature(payload) {
      // console.log('store.js setActiveModalFeature is running, payload:', payload);
      this.activeModalFeature = payload;
    },
    setImageOverlay(payload) {
      this.map.imageOverlay = payload;
    },
    setImageOverlayOpacity(payload) {
      this.map.imageOverlayOpacity = payload;
    },

    setPropertyBalance(payload) {
      this.appData.propertyBalance = payload;
    },

    // this is redundant with PVD
    setDidToggleModal(name) {
      // console.log('setDidToggleModal, name:', name, 'open:', open);
      // console.log('setDidToggleModal, name:', name);
      // modals[name].open = open === null ? !modals[name].open : open
      this.modals.open = name;
    },
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot))
};

  // let mergeStore = mb;
  // let mergeStore = mergeDeep(pvcStore, pvdStore.store);
  // mergeStore = mergeDeep(mergeStore, pvmStore);
  // mergeStore = mergeDeep(mergeStore, mb);

  // reset the map center and zoom based on the config
  // if (config.map) {
  //   mergeStore.map.center = config.map.center;
  //   mergeStore.map.zoom = config.map.zoom;
  //   mergeStore.pictometry.map.center = config.map.center;
  //   mergeStore.pictometry.map.zoom = config.map.zoom;
  // }


  // TODO standardize how payloads are passed around/handled
  // return new Vuex.Store({
  //   state: mergeStore.state,
  //   getters: mergeStore.getters,
  //   mutations: mergeStore.mutations,
  // });
// }

// export default createStore;
