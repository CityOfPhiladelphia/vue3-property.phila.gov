import { defineStore, acceptHMRUpdate } from 'pinia';

export const useDatafetchStore = defineStore("DatafetchStore", {
  state: () => {
    return {
      activeTopic: '',
      routerTopic: '',
      activeParcelLayer: '',
      clickCoords: null,
      // should addresscandidate be here if neither pvm or pvc were included?
      shouldShowAddressCandidateList: false,
      // the ais feature
      geocode: {
        status: null,
        data: null,
        input: null,
        related: null,
      },
      ownerSearch: {
        status: null,
        data: null,
        input: null,
        total_size: null,
      },
      activeSearch: {
      },
      blockSearch: {
        status: null,
        data: null,
        input: null,
        total_size: null,
      },
      shapeSearch: {
        status: null,
        data: null,
        input: null,
      },
      condoUnits: {
        status: null,
        units: null,
      },
      searchType: 'address',
      modals: {
        keys: [],
        open: '',
      },
      selectedServices: [],
      selectedKeywords: [],
      selectedZipcode: null,
    };
  },
  actions: {
    setSelectedZipcode(payload) {
      this.selectedZipcode = payload;
    },
    setSelectedServices(payload) {
      this.selectedServices = payload;
    },
    setSelectedKeywords(payload) {
      this.selectedKeywords = payload;
    },
    setSearchType(payload) {
      this.searchType = payload;
    },
    setActiveParcelLayer(payload) {
      // console.log('store.js setActiveParcelLayer is running, payload:', payload);
      this.activeParcelLayer = payload;
    },
    setRouterTopic(payload) {
      this.routerTopic = payload;
    },
    setActiveTopic(payload) {
      this.activeTopic = payload;
    },
    setClickCoords(payload) {
      this.clickCoords = payload;
    },
    setSourceStatus(payload) {
      // console.log('setSourceStatus is running, payload:', payload);
      const key = payload.key;
      const status = payload.status;

      // if a target id was passed in, set the status for that target
      const targetId = payload.targetId;

      if (targetId && this.sources[key].targets[targetId]) {
        // console.log('store.js setSourceStatus, key:', key, 'status:', status, 'targetId:', targetId);
        this.sources[key].targets[targetId].status = status;
      } else if (Object.keys(this.sources).includes(payload.key)) {
        this.sources[key].status = status;
      } else {
        this.pinSources[key].status = status;
      }
    },
    setSecondarySourceStatus(payload) {
      const key = payload.key;
      const secondaryStatus = payload.secondaryStatus;

      // if a target id was passed in, set the status for that target
      const targetId = payload.targetId;

      // if (targetId) {
      //   this.sources[key].targets[targetId].status = status;
      // } else {
      this.sources[key].secondaryStatus = secondaryStatus;
      // }
    },
    setSourceData(payload) {
      // console.log('store setSourceData is running, payload:', payload);
      const key = payload.key;
      const data = payload.data;

      // if a target id was passed in, set the data object for that target
      const targetId = payload.targetId;

      if (targetId) {
        if (this.sources[key].targets[targetId]) {
          this.sources[key].targets[targetId].data = data;
        }
      } else if (Object.keys(this.sources).includes(payload.key)) {
        this.sources[key].data = data;
      } else {
        this.pinSources[key].data = data;
      }
    },
    setSourceDataObject(payload) {
      // console.log('store setSourceDataObject is running, payload:', payload);
      const key = payload.key;
      const data = payload.data;
      this.sources[key].targets = data;
    },
    setSourceDataMore(payload) {
      // console.log('setSourceDataMore is running');
      const key = payload.key;
      const data = payload.data;
      const nextPage = payload.page;
      const oldData = this.sources[key].data;
      // console.log('oldData features', oldData.features, 'data features', data.features);
      const allData = oldData.features.concat(data.features);
      // console.log('allData', allData);
      // if a target id was passed in, set the data object for that target
      // const targetId = payload.targetId;

      // if (targetId) {
      //   this.sources[key].targets[targetId].data = data;
      // } else {

      this.sources[key].data.features = allData;
      this.sources[key].data.page = nextPage;
      // }
    },
    // this sets empty targets for a data source
    createEmptySourceTargets(payload) {
      // console.log('createEmptySourceTargets is running');
      const { key, targetIds } = payload;
      this.sources[key].targets = targetIds.reduce((acc, targetId) => {
        acc[targetId] = {
          status: null,
          data: null,
        };
        return acc;
      }, {});
    },
    clearSourceTargets(payload) {
      // console.log('clearSourceTargets is running, payload:', payload);
      const key = payload.key;
      this.sources[key].targets = {};
      if (this.sources[key].status) {
        this.sources[key].status = null;
      }
    },
    // this is the map center as an xy coordinate array (not latlng)
    setParcelData(payload) {
      // console.log('store setParcelData payload:', payload);
      const { parcelLayer, data, multipleAllowed, status, activeParcel, activeAddress, activeMapreg, mapregStuff } = payload || {};
      // console.log('store setParcelData mapregStuff:', mapregStuff, 'parcelLayer:', parcelLayer, 'data:', data, 'multipleAllowed:', multipleAllowed, 'status:', status, 'activeParcel:', activeParcel);
      if (!multipleAllowed || !mapregStuff) {
        // console.log('if');
        this.parcels[parcelLayer] = data;
      } else {
        // console.log('else');
        this.parcels[parcelLayer].data = data;
        this.parcels[parcelLayer].status = status;
        this.parcels[parcelLayer].activeParcel = activeParcel;
        this.parcels[parcelLayer].activeAddress = activeAddress;
        this.parcels[parcelLayer].activeMapreg = activeMapreg;
      }
    },
    setGeocodeStatus(payload) {
      this.geocode.status = payload;
    },
    setGeocodeData(payload) {
      // console.log('store.js setGeocodeData is running, payload:', payload);
      this.geocode.data = payload;
    },
    setGeocodeRelated(payload) {
      this.geocode.related = payload;
    },
    setGeocodeInput(payload) {
      this.geocode.input = payload;
    },
    setOwnerSearchStatus(payload) {
      this.ownerSearch.status = payload;
    },
    setOwnerSearchTotal(payload) {
      this.ownerSearch.total_size = payload;
    },
    setOwnerSearchData(payload) {
      this.ownerSearch.data = payload;
    },
    setOwnerSearchInput(payload) {
      this.ownerSearch.input = payload;
    },
    setShouldShowAddressCandidateList(payload) {
      this.shouldShowAddressCandidateList = payload;
    },
    setDidToggleModal(name) {
      this.modals.open = name;
    },

    setUnits(payload) {
      // console.log("setShapeSearchUnits: ", payload)
      this.condoUnits.units = payload;
    },
    setCondoUnitsStatus(payload) {
      this.condoUnits.status = payload;
    },
    setActiveSearchStatus(payload) {
      let key = payload.activeSearchKey;
      this.activeSearch[payload.activeSearchKey].status = payload.status;
    },
    setActiveSearchData(payload) {
      const key = payload.activeSearchKey;
      const data = payload.data;
      this.activeSearch[key].data = data;
    },

    setBlockSearchStatus(payload) {
      //console.log('setBlockSearchStatus is running, payload:', payload);
      this.blockSearch.status = payload;
    },
    setBlockSearchInput(payload) {
      console.log('setBlockSearchInput is running, payload:', payload);
      this.blockSearch.input = payload;
    },
    setBlockSearchData(payload) {
      this.blockSearch.data = payload;
    },
    setBlockSearchTotal(payload) {
      this.blockSearch.total_size = payload;
    },
    setBlockSearchDataPush(payload) {
      console.log('store.js, setBlockSearchDataPush is running, payload:', payload);
      let objIndex = parseInt(payload.objIndex);
      delete payload.objIndex;
      this.blockSearch.data.splice(objIndex + 1, 0, ...payload);
    },
    setShapeSearchStatus(payload) {
      //console.log('setShapeSearchStatus is running, payload:', payload);
      this.shapeSearch.status = payload;
    },
    setShapeSearchInput(payload) {
      this.shapeSearch.input = payload;
    },
    setShapeSearchData(payload) {
      console.log('store.js, setShapeSearchData is running, payload:', payload);
      this.shapeSearch.data = payload;
    },
    setShapeSearchDataPush(payload) {
      console.log('store.js, setShapeSearchDataPush is running, payload:', payload);
      let objIndex = parseInt(payload.objIndex);
      delete payload.objIndex;
      this.shapeSearch.data.rows.splice(objIndex + 1, 0, ...payload);
    },
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDatafetchStore, import.meta.hot))
};



// const initialState = {
  // this gets set to the parcel layer for the default (aka first) topic in
  // DataManager.resetGeocode, which is called by Router.hashChanged on app
  // load.

// };

// const pvdStore = {
//   createSources(config) {
//     // console.log('createSources is running, config:', config);
//     const sourceKeys = Object.keys(config.dataSources || {});
//     const sources = sourceKeys.reduce((o, key) => {
//       let val;
//       // if the source has targets, just set it to be an empty object
//       if (config.dataSources[key].targets) {
//         val = {
//           status: null,
//           targets: {},
//         };
//       } else {
//         val = {
//           // we have to define these here, because vue can't observe properties that
//           // are added later.
//           status: null,
//           secondaryStatus: null,
//           data: null,
//         };
//       }

//       o[key] = val;

//       return o;
//     }, {});
//     return sources;
//   },

//   createPinSources(config) {
//     // console.log('createSources is running, config:', config);
//     const sourceKeys = Object.keys(config.pinSources || {});
//     const sources = sourceKeys.reduce((o, key) => {
//       let val;
//       // if the source has targets, just set it to be an empty object
//       if (config.pinSources[key].targets) {
//         val = {
//           targets: {},
//         };
//       } else {
//         val = {
//           // we have to define these here, because vue can't observe properties that
//           // are added later.
//           status: null,
//           secondaryStatus: null,
//           data: null,
//         };
//       }

//       o[key] = val;

//       return o;
//     }, {});
//     return sources;
//   },
//   createActivesearch(config) {
//     // console.log('createSources is running, config:', config);
//     const sourceKeys = Object.keys(config.activeSearch || {});
//     const sources = sourceKeys.reduce((o, key) => {
//       let val = {
//         status: null,
//         data: null,
//       };
//       o[key] = val;
//       return o;
//     }, {});
//     return sources;
//   },

//   createParcels(config) {
//     // console.log('createParcels is running, config:', config);
//     const parcelKeys = Object.keys(config.parcels || {});
//     const parcels = parcelKeys.reduce((o, key) => {
//       let val;
//       if (config.parcels[key].multipleAllowed && config.parcels[key].mapregStuff) {
//         val = {
//           data: [],
//           status: null,
//           activeParcel: null,
//           activeAddress: null,
//           activeMapreg: null,
//         };
//         // console.log('if mapregStuff section running, key:', key, 'val:', val);
//       } else {
//         // console.log('else mapregStuff section running, key:', key);
//         val = null;
//         // val = {
//         //   geometry: null,
//         //   id: null,
//         //   properties: null,
//         //   type: null
//         // };
//       }

//       // console.log('o:', o, 'key:', key, 'val:', val, 'typeof val:', typeof val);
//       o[key] = val;
//       // console.log('o:', o, 'key:', key, 'val:', val);

//       return o;
//     }, {});
//     // console.log('end of createParcels, parcels:', parcels);
//     return parcels;
//   },

