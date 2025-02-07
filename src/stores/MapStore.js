import { defineStore, acceptHMRUpdate } from 'pinia';

// some default values, which get overwritten by the app importing
// these could be put in the object instead of this roundabout way
// but this is to remind me that mapboard store redefines these values
let config = {
  map: {
    center:[ -75.163471, 39.953338 ],
    zoom: 18,
  },
  // pictometry: {
  //   enabled: '',
  // },
  // cyclomedia: {
  //   enabled: '',
  // }
};

export const useMapStore = defineStore("MapStore", {
  state: () => {
    return {
      map: {},
      currentMapStyle: 'pwdDrawnMapStyle',
      currentAddressCoords: [],
      // currentTopicMapStyle: {},
      bufferForAddress: {},
      currentMarkersForTopic: [],
      addressMarker: null,
      addressParcel: null,
      initialized: false,
      draw: null,
      imageryOn: false,
      imagerySelected: '2023',
      cyclomediaOn: false,
      cyclomediaInitialized: false,
      cyclomediaRecordingsOn: false,
      cyclomediaCameraYaw: null,
      cyclomediaCameraHFov: null,
      cyclomediaCameraXyz: null,
      cyclomediaCameraLngLat: null,
      cyclomediaYear: null,
      clickedCyclomediaRecordingCoords: null,
      eagleviewOn: false,
      selectedRegmap: null,
      regmapOpacity: 0.5,
      zoningOpacity: 1,
      stormwaterOpacity: 1,
      labelLayers: [],



      activeTopic: '',
      shouldShowAddressCandidateList: false,
      drawStart: null,
      drawShape: null,
      draw: null,
      drawDistances: [],
      bufferMode: false,
      editableLayers: null,
      bufferShape: null,

      // map: {
      //   vectorLayerMouseover: null,
      //   location: {
      //     lat: null,
      //     lng: null,
      //   },
      //   center: config.map.center,
      //   bounds: {
      //     _northEast: {
      //       lat: null,
      //       lng: null,
      //     },
      //     _southWest: {
      //       lat: null,
      //       lng: null,
      //     },
      //   },
      //   zoom: config.map.zoom,
      //   boundsBasedOnShape: null,
      //   map: null,
      //   // this gets set to the parcel layer for the default topic by
      //   // DataManager.resetGeocode; see note above for activeTopic and
      //   basemap: '',
      //   imagery: 'imagery2019',
      //   selectedOverlay: null,
      //   shouldShowOverlaySelectControl: false,
      //   shouldShowBasemapSelectControl: false,
      //   // this is the key for the active overlay image (eg regmap)
      //   imageOverlay: null,
      //   imageOverlayOpacity: null,
      //   filters: [],
      //   watchPositionOn: false,
      //   shouldInitialize: true,
      //   initialized: null,
      // },
      // cyclomedia: {
      //   initializationBegun: false,
      //   initializationComplete: false,
      //   navBarOpen: false,
      //   // surfaceCursorOn: true,
      //   latLngFromMap: null,
      //   latLngFromRecordingClick: null,
      //   orientation: {
      //     yaw: null,
      //     hFov: null,
      //     xyz: null,
      //   },
      //   active: false,
      //   recordings: [],
      // },
      // we need this to know whether or not to force an update on the first show
      // pictometry: {
      //   ipa: null,
      //   active: false,
      //   shapeIds: [],
      //   pngMarkerIds: [],
      //   zoom: null,
      //   // this is the state of the main leaflet map. when these values change
      //   // the pictometry widget should react. the reason these are duplicated
      //   // here is to avoid an infinite loop in the Map component when the
      //   // viewport changes.
      //   map: {
      //     center: config.map.center,
      //     zoom: config.map.zoom,
      //   },
      // },
    };
  },
  actions: {
    setCyclomediaCameraYaw(yaw) {
      this.cyclomediaCameraYaw = yaw;
    },
    setCyclomediaCameraLngLat(lngLat, xyz) {
      this.cyclomediaCameraXyz = xyz;
      this.cyclomediaCameraLngLat = lngLat;
    },
    setMap(map) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore.setMap is running, map:', map);
      this.map = map;
    },
    setMapStyle(style) {
      this.currentMapStyle = style;
    },
    async fillBufferForAddress(lng, lat) {
      let thePoint = point([lng, lat])
      let theBuffer = buffer(thePoint, 750, {units: 'feet'});
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillBufferForAddress is running, thePoint:', thePoint, 'theBuffer:', theBuffer, 'lng:', lng, 'lat:', lat);
      this.bufferForAddress = theBuffer.geometry.coordinates;
    },


    setVectorLayerMouseover(payload) {
      this.map.vectorLayerMouseover = payload;
    },
    setMapType(payload) {
      this.map.type = payload;
    },
    setShouldInitializeMap(payload) {
      this.map.shouldInitialize = payload;
    },
    setInitializedMap(payload) {
      this.map.initialized = payload;
    },
    setBufferShape(payload) {
      this.bufferShape = payload;
    },
    setBufferMode(payload) {
      // console.log('setBufferMode is running, payload:', payload);
      this.bufferMode = payload;
    },
    setDraw(payload) {
      this.draw = payload;
    },
    setDrawStart(payload) {
      this.drawStart = payload;
    },
    setDrawShape(payload) {
      this.drawShape = payload;
    },
    setDrawDistances(payload) {
      this.drawDistances = payload;
    },
    setEditableLayers(payload) {
      this.editableLayers = payload;
    },
    setMapCenter(payload) {
      this.map.center = payload;
    },
    setMapZoom(payload) {
      this.map.zoom = payload;
    },
    setWatchPositionOn(payload) {
      this.map.watchPositionOn = payload;
    },
    setLocation(payload) {
      this.map.location.lat = payload.lat;
      this.map.location.lng = payload.lng;
    },
    setActiveTopic(payload) {
      this.activeTopic = payload;
    },
    setImagery(payload) {
      this.map.imagery = payload;
    },
    setSelectedOverlay(payload) {
      this.map.selectedOverlay = payload;
    },
    setShouldShowOverlaySelectControl(payload) {
      this.map.shouldShowOverlaySelectControl = payload;
    },
    setShouldShowBasemapSelectControl(payload) {
      this.map.shouldShowBasemapSelectControl = payload;
    },
    setShouldShowAddressCandidateList(payload) {
      this.shouldShowAddressCandidateList = payload;
    },


    setCyclomediaInitializationBegun(payload) {
      // console.log('setCyclomediaInitializationBegun is running, payload:', payload);
      this.cyclomedia.initializationBegun = payload;
    },
    setCyclomediaInitilizationComplete(payload) {
      // console.log('setCyclomediaInitializationComplete is running, payload:', payload);
      this.cyclomedia.initializationComplete = payload;
    },
    setPictometryActive(payload) {
      // if (!config.pictometry.enabled) {
      //   return;
      // }
      this.pictometry.active = payload;
    },
    setCyclomediaActive(payload) {
      // console.log('setCyclomediaActive is running, config:', config);
      // if (!config.cyclomedia.enabled) {
      //   return;
      // }
      this.cyclomedia.active = payload;
    },
    setCyclomediaYaw(payload) {
      // console.log('setCyclomediaYaw is running, payload:', payload);
      this.cyclomedia.orientation.yaw = payload;
    },
    setCyclomediaHFov(payload) {
      // console.log('setCyclomediaHFov is running, payload:', payload);
      this.cyclomedia.orientation.hFov = payload;
    },
    setCyclomediaXyz(payload) {
      // console.log('setCyclomediaXyz is running, payload:', payload);
      this.cyclomedia.orientation.xyz = payload;
    },
    setCyclomediaRecordings(payload) {
      this.cyclomedia.recordings = payload;
    },
    setCyclomediaLatLngFromMap(payload) {
      this.cyclomedia.latLngFromMap = payload;
      // const { lat, lng } = payload || {};
      // this.cyclomedia.latLngFromMap[0] = lat;
      // this.cyclomedia.latLngFromMap[1] = lng;
    },
    setCyclomediaLatLngFromRecordingClick(payload) {
      this.cyclomedia.latLngFromRecordingClick = payload;
    },
    setCyclomediaNavBarOpen(payload) {
      this.cyclomedia.navBarOpen = payload;
    },
    // setCyclomediaSurfaceCursorOn(payload) {
    //   this.cyclomedia.surfaceCursorOn = payload;
    // },

    setPictometryIpa(payload) {
      this.pictometry.ipa = payload;
    },
    setPictometryShapeIds(payload) {
      this.pictometry.shapeIds = payload;
    },
    setPictometryPngMarkerIds(payload) {
      this.pictometry.pngMarkerIds = payload;
    },
    // this is the leaflet map center updated when the map is moved
    setPictometryMapCenter(payload) {
      this.pictometry.map.center = payload;
    },
    setPictometryMapZoom(payload) {
      this.pictometry.map.zoom = payload;
    },
    setPictometryZoom(payload) {
      this.pictometry.zoom = payload;
    },
    setMap(payload) {
      console.log('store.js setMap running, payload:', payload);
      this.map.map = payload.map;
    },
    setBasemap(payload) {
      this.map.basemap = payload;
    },
    setShouldShowImagery(payload) {
      this.map.shouldShowImagery = payload;
    },
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMapStore, import.meta.hot))
};
