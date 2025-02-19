<script setup>

import config from '../config.js';

import { computed, watch, ref, onBeforeMount, onMounted } from 'vue';

import { useMainStore } from '@/stores/MainStore.js';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();
import { useDatafetchStore } from '@/stores/DatafetchStore.js';
const DatafetchStore = useDatafetchStore();
import Map from '@/components/map/Map.vue';
import FullScreenMapToggleTab from '@/components/FullScreenMapToggleTab.vue';

// import throttle from 'lodash-es/throttle';

import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import destination from '@turf/destination';
import distance from '@turf/distance';
import midpoint from '@turf/midpoint';
import area from '@turf/area';
// import convertArea from '@turf/convertArea';
import { point, polygon, convertArea, featureCollection } from '@turf/helpers';

import 'maplibre-gl/dist/maplibre-gl.css';
  
// const geolocationPositionOptions = ref({
//   enableHighAccuracy: true,
//   timeout: 6000,
// });
// const zoomToShape = ref({
//   geojsonParcels: [],
//   markersForAddress: [],
// });
const lastGeocodeGeom = ref({});
const lastGeocodeResult = ref({});
const buttonDimensions = ref({
  'barHeight': '49px',
  'barLineHeight': '49px',
  'buttonHeight': '45px',
  'buttonWidth': '45px',
  'buttonLineHeight': '45px',
});
const watchedZoom = ref(null);
const geojsonCameraSource = ref({
  'type': 'geojson',
  'data': {
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [],
    },
  },
});
const geojsonCameraLayer = ref({
  'id': 'cameraPoints',
  'type': 'symbol',
  'source': 'cameraPoint',
  'layout': {
    'icon-image': 'cameraMarker',
    'icon-size': 0.09,
    // 'icon-size': 0.13,
    'icon-rotate': 0,
    'icon-rotation-alignment': 'map',
  },
});
const geojsonViewconeSource = ref({
  'type': 'geojson',
  'data': {
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [[]],
    },
  },
});
const geojsonViewconeLayer = ref({
  'id': 'viewcones',
  'type': 'fill',
  'source': 'viewcone',
  'layout': {},
  'paint': {
    'fill-color': 'rgb(0,102,255)',
    'fill-opacity': 0.2,
  },
});
const geojsonParcelSources = ref(null);
const geojsonParcelFillLayer = ref({
  'id': 'geojsonParcelFill',
  'type': 'fill',
  'layout': {},
  'paint': {
    'fill-color': 'blue',
    'fill-opacity': 0.3,
  },
});
const geojsonParcelLineLayer = ref({
  'id': 'geojsonParcelLine',
  'type': 'line',
  'layout': {},
  'paint': {
    'line-color': 'blue',
    'line-width': 2,
  },
});
const geojsonActiveParcelSources = ref(null);
const geojsonActiveParcelFillLayer = ref({
  'id': 'geojsonActiveParcelFill',
  'type': 'fill',
  'layout': {},
  'paint': {
    'fill-color': 'yellow',
    'fill-opacity': 0.3,
  },
});
const geojsonActiveParcelLineLayer = ref({
  'id': 'geojsonActiveParcelLine',
  'type': 'line',
  'layout': {},
  'paint': {
    'line-color': 'yellow',
    'line-width': 2,
  },
});
const geojsonBufferShapeSource = ref(null);
const geojsonBufferShapeFillLayer = ref({
  'id': 'geojsonBufferShapeFill',
  'type': 'fill',
  'layout': {},
  'paint': {
    'fill-color': 'gray',
    'fill-opacity': 0.3,
  },
});
const draw = ref({
  mode: null,
  selection: null,
  labelLayers: [],
  currentArea: null,
});

// computed
const cyclomediaActive = computed(() => {
  return MapStore.cyclomedia.active;
});

const isLarge = computed(() => {
  return MainStore.isLarge;
});

const isLargeClass = computed(() => {
  let value;
  if (isLarge.value) {
    value = 'is-large';
  } else {
    value = 'is-small';
  }
  return value;
});

const currentCycloOrientation = computed(() => {
  let value;
  if (isLarge.value && !leftPanel.value) {
    value = 'horizontal';
  } else {
    value = 'vertical';
  }
  return value;
});

const boundsProp = computed(() => {
  let bounds = MapStore.map.bounds;
  // console.log('boundsProps, bounds:', bounds);
  let finalBounds;

  if (bounds._northEast && bounds._northEast.lat != null) {
    finalBounds = [[ bounds._southWest.lng, bounds._southWest.lat ], [ bounds._northEast.lng, bounds._northEast.lat ]];
  } else if (bounds._northEast && bounds._northEast.lat == null) {
    // finalBounds = [[ -75.0936906502695, 39.999379013777684 ], [ -75.23325134973207, 39.9072659724458 ]];
  } else {
    finalBounds = bounds;
  }
  return finalBounds;
});

const imageryShowing = computed(() => {
  let value;
  if (activeBasemap.value === 'pwd' || activeBasemap.value === 'dor') {
    value = false;
  } else {
    value = true;
  }
  return value;
});

const basemapImageLink = computed(() => {
  if (activeBasemap.value === 'pwd' || activeBasemap.value === 'dor') {
    return window.location.origin + '/images/imagery_small.png';
  } else {
    return window.location.origin + '/images/basemap_small.png';
  }
});

const basemapSources = computed(() => {
  return config.basemapSources;
});

const basemapLabelSources = computed(() => {
  return config.basemapLabelSources;
});

const overlaySources = computed(() => {
  return config.overlaySources;
});

const shouldShowRasterLayer = computed(() => {
  let value = true;
  if (config.map.tiles === 'hosted') {
    value = false;
  }
  return value;
});

const basemapsAndLabelsBefore = computed(() => {
  let basemapsBefore = basemapsBefore.value;
  basemapsBefore.push('imageryBasemapLabels');
  return basemapsBefore;      
});

const basemapsBefore = computed(() => {
  let value = [
    'gl-draw-line.hot',
    'gl-draw-polygon-fill.hot',
    'gl-draw-polygon-stroke-active.hot',
    'gl-draw-polygon-and-line-vertex-halo-active.hot',
    'gl-draw-polygon-and-line-vertex-active.hot',
    'gl-draw-line-static',
  ];
  // if (imageOverlay.value != null) {
  //   value.push(imageOverlay.value);
  // }
  if (geojsonParcels.value) {
    // console.log('computing basemapsBefore, geojsonParcels.value.length:', geojsonParcels.value.length);
    for (let i=0; i<geojsonParcels.value.length; i++) {
      value.push('geojsonParcelLine' + i);
      value.push('geojsonParcelFill' + i);
    }
  }
  return value;
});

const leftPanel = computed(() => {
  return MainStore.leftPanel;
});

const isMobileOrTablet = computed(() => {
  return MainStore.isMobileOrTablet;
});

const fullScreenDataEnabled = computed(() => {
  return MainStore.fullScreenDataEnabled;
});

const mapDivClass = computed(() => {
  if (cyclomediaActive.value) {
    return 'map-div-cyclo';
  }
  return 'map-div';
});

const bufferButtonActiveClass = computed(() => {
  // console.log("bufferButtonActiveClass: ", MapStore.bufferMode);
  return MapStore.bufferMode ? '' : 'inactive-buffer-button';
});

const drawButtonActiveClass = computed(() => {
  // console.log("bufferButtonActiveClass: ", MapStore.bufferMode);
  return MapStore.drawStart === null || MapStore.drawStart === false ? 'inactive-draw-button' : '';
});

const buttonClass = computed(() => {
  if (isMobileOrTablet.value) {
    return 'mobile-button';
  }
  return 'non-mobile-button pointer';
});

const lastSearchMethod = computed(() => {
  return DatafetchStore.lastSearchMethod;
});

const drawProps = computed(() => {
  const draw = {
    polyline: true,
    polygon: false,
    circle: false,
    marker: false,
    rectangle: true,
  };
  return draw;
});

// const addressAutocompleteEnabled = computed(() => {
//   // TODO tidy up the code
//   if (config.addressInput) {
//     if (config.addressInput.autocompleteEnabled === true) {
//       return true;
//     }
//     return false;
//   }
//   return false;
// });

const addressInputPosition = computed(() => {
  return 'topleft';
});

// const addressInputWidth = computed(() => {
//   if (config.addressInput) {
//     return config.addressInput.mapWidth;
//   }
//   return 300;
// });

// const addressInputPlaceholder = computed(() => {
//   if (config.addressInput) {
//     return config.addressInput.placeholder;
//   }
//   return null;
// });

const basemapSelectControlPosition = computed(() => {
  return 'topalmostright';
});

const shouldShowAddressCandidateList = computed(() => {
  return MapStore.shouldShowAddressCandidateList;
});

const measureControlEnabled = computed(() => {
  if (config.measureControlEnabled === false) {
    return false;
  }
  return true;
});

const fullScreenMapEnabled = computed(() => {
  return MainStore.fullScreenMapEnabled;
});

const mapPanelContainerClass = computed(() => {
  if (leftPanel.value) {
    return 'small-24 small-order-1 medium-12 medium-order-2';
  }
  return 'small-24 small-order-1 medium-24 medium-order-2 grid-x';
});

// const mapPanelClass = computed(() => {
//   if (!leftPanel.value && isLarge.value && MapStore.cyclomedia.active) {
//     // return 'small-24 medium-24 map-panel-class-50';
//     return 'small-24 medium-12 map-panel-class';
//   } else if (MapStore.cyclomedia.active) {
//     return 'small-24 medium-24 map-panel-class-50';
//   } else {
//     return 'small-24 medium-24 map-panel-class';
//   }
//   // return 'small-24 medium-24 map-panel-class';
// });

const loadingMaskLeft = computed(() => {
  if (MapStore.cyclomedia.active) {
    return 'mb-map-loading-mask-inner left-fifteen';
  }
  return 'mb-map-loading-mask-inner left-forty';
});

const geolocationEnabled = computed(() => {
  if (config.geolocation) {
    return config.geolocation.enabled;
  }
  return false;
});

const legendControls = computed(() => {
  return config.legendControls || {};
});

const activeBasemap = computed(() => {
  const shouldShowBasemapSelectControl = MapStore.map.shouldShowBasemapSelectControl;
  if (shouldShowBasemapSelectControl) {
    return MapStore.map.imagery;
  }
  const defaultBasemap = config.map.defaultBasemap;
  const basemap = MapStore.map.basemap || defaultBasemap;
  return basemap;
});

const tiledLayers = computed(() => {
  const activeBasemap = activeBasemap.value;
  const activeBasemapConfig = configForBasemap(activeBasemap);
  return activeBasemapConfig.tiledLayers || [];
});

const activeFeatureLayers = computed(() => {
  if (!activeTopicConfig.value || !activeTopicConfig.value.featureLayers) {
    return [];
  }
  return activeTopicConfig.value.featureLayers;
});

const activeFeature = computed(() => {
  return MainStore.activeFeature;
});

const basemaps = computed(() => {
  return Object.values(config.map.basemaps);
});

const imageryBasemaps = computed(() => {
  return basemaps.value.filter(basemap => basemap.type === 'imagery');
});

const hasImageryBasemaps = computed(() => {
  return imageryBasemaps.value.length > 0;
});

const shouldShowImageryToggle = computed(() => {
  if (config.map.imagery) {
    return hasImageryBasemaps.value && config.map.imagery.enabled;
  }
  return hasImageryBasemaps.value;
});

const identifyFeature = computed(() => {
  let configFeature;
  if (geocodeType.value === 'intersection') {
    configFeature = "address-marker";
  } else if (activeTopicConfig.value.identifyFeature) {
    configFeature = activeTopicConfig.value.identifyFeature;
  } else {
    if (config) {
      configFeature = config.map.defaultIdentifyFeature;
    }
  }
  return configFeature;
});

const activeTopic = computed(() => {
  return DatafetchStore.activeTopic;
});

const activeTopicConfig = computed(() => {
  const key = activeTopic.value;
  let config;

  // if no active topic, return null
  if (key) {
    config = config.topics.filter((topic) => {
      return topic.key === key;
    })[0];
  }
  return config || {};
});

const activeParcelLayer = computed(() => {
  return activeTopicConfig.value.parcels;
});

const pwdParcel = computed(() => {
  return MainStore.parcels.pwd;
});

const geocodeResult = computed(() => {
  return DatafetchStore.geocode.data || {};
});

const geocodeGeom = computed(() => {
  return geocodeResult.value.geometry;
});

const geocodeType = computed(() => {
  return geocodeResult.value.ais_feature_type;
});

const streetAddress = computed(() => {
  return geocodeResult.value.properties.street_address;
});

// const mapBounds = computed(() => {
//   // TODO calculate map bounds based on leaflet markers above
// });

const boundsBasedOnShape = computed(() => {
  return MapStore.map.boundsBasedOnShape;
});

const isGeocoding = computed(() => {
  return DatafetchStore.geocode.status === 'waiting';
});

const cycloLatlng = computed(() => {
  if (MapStore.cyclomedia.orientation.xyz !== null) {
    const xyz = MapStore.cyclomedia.orientation.xyz;
    return [ xyz[1], xyz[0] ];
  } else if (config && config.map) {
    const center = config.map.center;
    return center;
  }
});

const cycloRotationAngle = computed(() => {
  return MapStore.cyclomedia.orientation.yaw;// * (180/3.14159265359);
});

const cycloHFov = computed(() => {
  return MapStore.cyclomedia.orientation.hFov;
});

const shouldShowCyclomediaButton = computed(() => {
  return config.cyclomedia.enabled;
});

const sitePath = computed(() => {
  if (process.env.VUE_APP_PUBLICPATH) {
    return window.location.origin + process.env.VUE_APP_PUBLICPATH;
  }
  return '';
});

const currentBuffer = computed(() => {
  let values = MapStore.bufferShape;
  let valuesFlipped;
  if (values) {
    valuesFlipped = [];
    for (let value of values) {
      let valueFlipped = [];
      valueFlipped[0] = value[1];
      valueFlipped[1] = value[0];
      valuesFlipped.push(valueFlipped);
    }
  }
  return valuesFlipped;
});

const locationMarker = computed(() => {
  const latlngArray = [ MapStore.map.location.lat, MapStore.map.location.lng ];
  const marker = {
    latlng: latlngArray,
    radius: 6,
    fillColor: '#ff3f3f',
    color: '#ff0000',
    weight: 1,
    opacity: 1,
    fillOpacity: 1.0,
  };
  return marker;
});

// returns map markers as simple object with a geometry property, key,
// and optional properties for symbology
const markersForAddress = computed(() => {
  // console.log('markers-mixin.js markersForAddress computed is running');
  const markers = [];
  // geocoded address marker
  const geocodeGeom = geocodeGeom.value;
  if (identifyFeature.value === 'address-marker' && geocodeGeom) {
    const latlng = [ ...geocodeGeom.coordinates ].reverse();
    const key = geocodeResult.value.properties.street_address;
    const color = '#2176d2';
    const markerType = 'geocode';
    const icon = {
      prefix: 'fas',
      icon: 'map-marker-alt',
      shadow: true,
      size: 50,
    };
    const addressMarker = {
      latlng, key, color, markerType, icon
    };
    markers.push(addressMarker);
  }
  return markers;
});

// returns geojson parcels to be rendered on the map along with
// necessary props.
const geojsonParcels = computed(() => {
  console.log('markers-mixin.js, recalculating geojsonParcels');
  let features;
  let shapes = [];
  let blockShapes = [];
  if (DatafetchStore.shapeSearch.data) {
    shapes = DatafetchStore.shapeSearch.data.rows;
  } else if (DatafetchStore.blockSearch.data) {
    blockShapes = DatafetchStore.blockSearch.data;
  }
  if (pwdParcel.value){
    let props = {};
    console.log('markers-mixin.js, recalculating geojsonParcels, pwdParcel.value:', pwdParcel.value);
    features = pwdParcel.value;
    if(features.length > 1) {
      // features.forEach( feature => Object.assign(feature.properties, props));
      for (let feature of features) {
        // console.log('feature:', feature, 'shapes:', shapes);
        if (shapes.length) {
          for (let shape of shapes) {
            if (shape.pwd_parcel_id === feature.properties.PARCELID) {
              feature.properties._featureId = shape._featureId;
              break;
            }
          }
        } else if (blockShapes.length) {
          for (let shape of blockShapes) {
            // console.log('blockShapes loop, shape.properties.pwd_parcel_id:', shape.properties.pwd_parcel_id, 'feature.properties.PARCELID:', feature.properties.PARCELID);
            if (shape.properties.pwd_parcel_id == feature.properties.PARCELID) {
              feature.properties._featureId = shape._featureId;
              break;
            }
          }
        }
      }
    } else if (typeof features[0] !== 'undefined') {
      // console.log("features:", features)
      Object.assign(features[0].properties, props);
      features = [ features[0] ];
      features[0].properties._featureId = 'feat-geocode-0';
    } else {
      Object.assign(features.properties, props);
      features = [ features ];
    }
  }
  console.log('markers-mixin.js, recalculating geojsonParcels, features: ', features);
  return features;
});

// watch
watch(
  () => watchedZoom,
  (nextWatchedZoom) => {
  console.log('watch watchedZoom is firing, nextWatchedZoom:', nextWatchedZoom);
  if (cyclomediaActive.value) {
    handleCycloChanges();
  }
  let map = MapStore.map;
  if (nextWatchedZoom && map) {
    MapStore.map.setZoom(nextWatchedZoom);
  }
});

watch(
  () => cycloLatlng,
  (nextCycloLatlng) => {
  // console.log('watch cycloLatlng, nextCycloLatlng:', nextCycloLatlng, 'geojsonCameraSource.value:', geojsonCameraSource.value);
  geojsonCameraSource.value.data.geometry.coordinates = [ nextCycloLatlng[1], nextCycloLatlng[0] ];
  handleCycloChanges();
});

watch(
  () => cycloRotationAngle,
  (nextCycloRotationAngle) => {
  // console.log('watch cycloRotationAngle is firing, nextCycloRotationAngle:', nextCycloRotationAngle);
  geojsonCameraLayer.value.layout['icon-rotate'] = nextCycloRotationAngle;
  handleCycloChanges();
});

watch(
  () => cycloHFov,
  (nextCycloHFov) => {
  // console.log('watch cycloHFov is running, nextCycloHFov:', nextCycloHFov);
  handleCycloChanges();
});

watch(
  () => currentBuffer,
  (nextCurrentBuffer) => {
  let value = {
    'type': 'geojson',
    'data': {
      'type': 'Feature',
      'geometry': {
        'type': 'Polygon',
        'coordinates': [ nextCurrentBuffer ],
      },
    },
  };
  geojsonBufferShapeSource.value = value;
});

watch(
  () => fullScreenDataEnabled,
  (nextfullScreenDataEnabled) => {
  MapStore.map.resize();
});

watch(
  () => fullScreenMapEnabled,
  (nextFullScreenMapEnabled) => {
  MapStore.map.resize();
});

watch(
  () => geocodeGeom,
  (nextGeocodeGeom) => {
  if (nextGeocodeGeom) {
    lastGeocodeGeom.value = nextGeocodeGeom;
  }
});

watch(
  () => geocodeResult,
  (nextGeocodeResult) => {
  console.log('watch geocodeResult is running, nextGeocodeResult:', nextGeocodeResult);
  if (Object.keys(nextGeocodeResult).length > 0) {
    lastGeocodeResult.value = nextGeocodeResult;
    if (nextGeocodeResult._featureId) {
      watchedZoom.value = geocodeZoom.value;
      let store = MapStore;
      let config = config;
      const myMethod = (function() {
        console.log('myMethod is running, store:', store, 'nextGeocodeResult:', nextGeocodeResult, 'store.state:', store.state, 'config:', config);
        store.commit('setMapCenter', nextGeocodeResult.geometry.coordinates);
        store.commit('setMapZoom', config.map.zoom);
      }).bind(store, config);
      setTimeout(myMethod, 250);
    }
  }
});

watch(
  () => geojsonParcels,
  (nextGeojson) => {
  console.log('watch geojsonParcels is running, nextGeojson:', nextGeojson);
  let value = []
  if (nextGeojson && nextGeojson.length) {
    for (let parcel of nextGeojson) {
      console.log('in loop, parcel:', parcel);
      value.push(
        {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'geometry': {
              'type': 'Polygon',
              'coordinates': parcel.geometry.coordinates,
            },
            'properties': {
              'parcelId': parcel.properties.PARCELID,
              'featureId': parcel.properties._featureId,
            },
          },
        },
      )
    }
  }
  geojsonParcelSources.value = value;

  if (!MainStore.mapViewWasSetOnAppLoad && lastSearchMethod.value === 'shape search') {
    console.log('watch geojsonParcels is affecting things');
    setMapToBounds();
    MainStore.setMapViewWasSetOnAppLoad(true);
  } else if (DatafetchStore.lastSearchMethod === 'block search') {
    console.log(MainStore.parcels.pwd[0].geometry.coordinates[0][0]);
    MapStore.setMapCenter(MainStore.parcels.pwd[0].geometry.coordinates[0][0]);
  }
});

watch(
  () => leftPanel,
  async(nextLeftPanel) => {
  // console.log('MapPanel.vue watch leftPanel is firing, nextLeftPanel:', nextLeftPanel);
  if (DatafetchStore.geocode.data && Object.keys(DatafetchStore.geocode.data).length > 0) {
    lastGeocodeResult.value = DatafetchStore.geocode.data;
    if (DatafetchStore.geocode.data._featureId) {
      let store = MapStore;
      let config = config;
      const myMethod = (function() {
        store.commit('setMapCenter', store.state.geocode.data.geometry.coordinates);
        store.commit('setMapZoom', config.map.zoom);
      }).bind(store, config);
      setTimeout(myMethod, 250);
    }
  }
  await nextTick()
  MapStore.map.resize();
});

watch(
  () => cyclomediaActive,
  async (value) => {
  await nextTick()
  MapStore.map.resize();
  // MapStore.map.map.invalidateSize();
});

watch(
  () => activeFeature,
  (nextActiveFeature, prevActiveFeature) => {
  console.log('WATCH active feature', prevActiveFeature, '=>', nextActiveFeature);

  if (prevActiveFeature && prevActiveFeature.featureId) {
    geojsonActiveParcelSources.value = [];
  }

  if (nextActiveFeature && nextActiveFeature.featureId) {

    let updateFeatureNext = nextActiveFeature.featureId;
    let pwdParcels = MainStore.parcels.pwd;

    let parseFeatureNext, numberFeatureNext;
    if (typeof updateFeatureNext == 'string') {
      parseFeatureNext = updateFeatureNext.split('-');
    }
    if (parseFeatureNext && parseFeatureNext.length) {
      numberFeatureNext = parseFloat(parseFeatureNext[0]);
    }
    console.log('watch active feature, parseFeatureNext:', parseFeatureNext);

    let currentShape;
    let shapes = [];

    if (DatafetchStore.shapeSearch.data) {
      shapes = DatafetchStore.shapeSearch.data.rows;
      for (let shape of shapes) {
        if (shape._featureId === updateFeatureNext) {
          for (let parcel of pwdParcels) {
            if (parcel.properties.PARCELID === shape.pwd_parcel_id || parcel.properties.PARCELID === numberFeatureNext) {
              currentShape = parcel;
              break;
            }
          }
          break;
        }
      }
    } else if (DatafetchStore.blockSearch.data) {
      shapes = DatafetchStore.blockSearch.data;
      // console.log('activeFeature, shapes:', shapes);
      for (let shape of shapes) {
        if (shape._featureId == updateFeatureNext) {
          for (let parcel of pwdParcels) {
            // console.log('activeFeature shape loop, inside if, shape._featureId:', shape._featureId, 'updateNeatureNext:', updateFeatureNext, 'parcel.properties.PARCELID:', parcel.properties.PARCELID, 'shape.properties.pwd_parcel_id:', shape.properties.pwd_parcel_id);
            if (parcel.properties.PARCELID == shape.properties.pwd_parcel_id) {
              currentShape = parcel;
              break;
            }
          }
          break;
        }
      }
    } else {
      currentShape = pwdParcels[0];
    }

    // console.log('markers-mixin.js watch activeFeature, updateFeatureNext:', updateFeatureNext, 'shapes:', shapes, 'currentShape:', currentShape);
    if (currentShape) {
      geojsonActiveParcelSources.value = [
        {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'geometry': {
              'type': 'Polygon',
              'coordinates': currentShape.geometry.coordinates,
            },
          },
        },
      ];
    }
  }
});

onBeforeMount(async () => {
  // if there's a default address, navigate to it
  const defaultAddress = config.defaultAddress;
  if (defaultAddress) {
    // $controller.goToDefaultAddress(defaultAddress);
  }

  const cyclomediaConfig = config.cyclomedia || {};
  if (cyclomediaConfig.enabled) {
    // create cyclomedia recordings client
    cyclomediaRecordingsClient.value = new CyclomediaRecordingsClient(
      config.cyclomedia.recordingsUrl,
      config.cyclomedia.username,
      config.cyclomedia.password,
      4326,
    );
  }

  // console.log('MapPanel.vue created, isMobileOrTablet.value:', isMobileOrTablet.value);
  if (isMobileOrTablet.value) {
    buttonDimensions.value = {
      'barHeight': '30px',
      'barWidth': '30px',
      'barLineHeight': '30px',
      'buttonHeight': '30px',
      'buttonWidth': '30px',
      'buttonLineHeight': '30px',
    };
  }
});

onMounted(async () => {
  // console.log('MapPanel mounted is running, DrawControl', DrawControl)
  const map = MapStore.map.map;
  MapStore.setImagery('imagery2023');
});

// methods
const handleBufferButtonClick = (e) => {
  // console.log('handleBufferButtonClick is running, Object.keys(MapStore):', Object.keys(MapStore));
  const bufferMode = MapStore.bufferMode;
  MapStore.setBufferMode(!bufferMode);
  if (Object.keys(MapStore).includes('drawStart')) {
    MapStore.draw.trash();
    MapStore.draw.changeMode('simple_select');
    MapStore.setDrawStart(null);
    const cancelButton = document.querySelector('[title="Cancel drawing"]');
    if (cancelButton) {
      cancelButton.click();
    }
  }
};

const onMapLoaded = (event) => {
  console.log('onMapLoaded is running, event.map:', event.map, MapStore.map);
  MapStore.map = event.map;
};

const onMapPreloaded = (event) => {
  let logo = document.getElementsByClassName('mapboxgl-ctrl-logo');
  // console.log('MapPanel onMapPreloaded, logo:', logo, 'logo.length:', logo.length, 'logo.item(0):', logo.item(0));
  logo[0].remove();
  let attrib = document.getElementsByClassName('mapboxgl-ctrl-attrib');
  attrib[0].remove();
};

const handleBasemapToggleClick = () => {
  // console.log('handleBasemapToggleClick, MapStore.map.getStyle().layers:', MapStore.map.getStyle().layers);
  const prevShouldShowBasemapSelectControl = MapStore.map.shouldShowBasemapSelectControl;
  const nextShouldShowBasemapSelectControl = !prevShouldShowBasemapSelectControl;
  MapStore.setShouldShowBasemapSelectControl(nextShouldShowBasemapSelectControl);
};

const handleCycloChanges = () => {
  // console.log('handleCycloChanges is running');
  const halfAngle = cycloHFov.value / 2.0;
  let angle1 = cycloRotationAngle.value - halfAngle;
  let angle2 = cycloRotationAngle.value + halfAngle;
  // console.log('handleCycloChanges, halfAngle:', halfAngle, 'angle1:', angle1, 'cycloRotationAngle.value:', cycloRotationAngle.value, 'angle2:', angle2);

  let distance;
  if (watchedZoom.value < 9) {
    distance = 2000 * (21 - watchedZoom.value);
  } else if (watchedZoom.value < 10) {
    distance = 1000 * (21 - watchedZoom.value);
  } else if (watchedZoom.value < 11) {
    distance = 670 * (21 - watchedZoom.value);
  } else if (watchedZoom.value < 12) {
    distance = 420 * (21 - watchedZoom.value);
  } else if (watchedZoom.value < 13) {
    distance = 270 * (21 - watchedZoom.value);
  } else if (watchedZoom.value < 14) {
    distance = 150 * (21 - watchedZoom.value);
  } else if (watchedZoom.value < 15) {
    distance = 100 * (21 - watchedZoom.value);
  } else if (watchedZoom.value < 16) {
    distance = 55 * (21 - watchedZoom.value);
  } else if (watchedZoom.value < 17) {
    distance = 30 * (21 - watchedZoom.value);
  } else if (watchedZoom.value < 18) {
    distance = 25 * (21 - watchedZoom.value);
  } else if (watchedZoom.value < 20.4) {
    distance = 15 * (21 - watchedZoom.value);
  } else {
    distance = 10;
  }

  // console.log('handleCycloChanges is running, watchedZoom.value:', watchedZoom.value, 'distance:', distance);
  let options = { units: 'feet' };

  if (!cycloLatlng.value) {
    return;
  }

  var destination1 = destination([ cycloLatlng.value[1], cycloLatlng.value[0] ], distance, angle1, options);
  var destination2 = destination([ cycloLatlng.value[1], cycloLatlng.value[0] ], distance, angle2, options);
  // console.log('cyclocenter:', [cycloLatlng.value[1], cycloLatlng.value[0]], 'destination1:', destination1.geometry.coordinates, 'destination2:', destination2.geometry.coordinates);
  // console.log('destination1:', destination1.geometry.coordinates, 'destination2:', destination2.geometry.coordinates);

  geojsonViewconeSource.value.data.geometry.coordinates = [
    [
      [ cycloLatlng.value[1], cycloLatlng.value[0] ],
      [ destination1.geometry.coordinates[0], destination1.geometry.coordinates[1] ],
      [ destination2.geometry.coordinates[0], destination2.geometry.coordinates[1] ],
      [ cycloLatlng.value[1], cycloLatlng.value[0] ],
    ],
  ];
};

const handleCyclomediaButtonClick = (e) => {
  // console.log('handleCyclomediaButtonClick is running');
  if (!cyclomediaInitializationBegun) {
    MapStore.setCyclomediaInitializationBegun(true);
  }
  const willBeActive = !MapStore.cyclomedia.active;

  MapStore.setCyclomediaActive(willBeActive);
};

const handleSearchFormSubmit = (value) => {
  // console.log('MapPanel.vue handleSearchFormSubmit is running');
  // $controller.handleSearchFormSubmit(value);
};

const setMapToBounds = () => {
  console.log('setMapToBounds is running, geojsonParcels.value:', geojsonParcels.value);
  let featureArray = [];
  for (let geojsonFeature of geojsonParcels.value) {
    featureArray.push(GeoJSON(geojsonFeature));
  }

  const theFeatureCollection = featureCollection(featureArray);
  console.log('featureArray:', featureArray, 'theFeatureCollection:', theFeatureCollection);
  const bounds = bbox(theFeatureCollection);

  // const group = new FeatureGroup(featureArray);
  // const bounds = group.getBounds();
  MapStore.setMapBounds(bounds);
};

const configForBasemap = (basemap) => {
  return config.map.basemaps[basemap] || {};
};

const shouldShowGeojson = (key) => {
  if (activeTopicConfig.value.basemap === 'pwd') {
    return true;
  }
  return key === activeDorParcel.value;

};

const shouldShowFeatureLayer = (key) => {
  if (activeFeatureLayers.value.includes(key)) {
    return true;
  }
  return false;
};

const handleMapClick = (e) => {
  let drawMode = draw.value.mode;
  let drawLayers = MapStore.map.queryRenderedFeatures(e.mapboxEvent.point).filter(feature => [ 'mapbox-gl-draw-cold', 'mapbox-gl-draw-hot' ].includes(feature.source));
  console.log('MapPanel.vue handleMapClick, drawMode:', drawMode, 'e:', e, 'MapStore.map.getStyle():', MapStore.map.getStyle(), 'MapStore.drawStart:', MapStore.drawStart);

  if (!drawLayers.length && drawMode !== 'draw_polygon') {
  // if (drawMode !== 'draw_polygon') {
    // $controller.handleMapClick(e);
  }
};

const handleDrawModeChange = (e) => {
  console.log('MapPanel.vue handleDrawModeChange is running, e:', e, 'e.mode:', e.mode, 'MapStore.map.getStyle():', MapStore.map.getStyle());
  if (e.mode !== 'simple_select' && MapStore.bufferMode) {
    MapStore.setBufferMode(false);
  }

  draw.value.mode = e.mode;

  if (e.mode === 'simple_select') {
    handleDrawFinish();
  }
};

const handleDrawFinish = (e) => {
  let draw = MapStore.draw;
  let data = draw.getAll();
  let coordinates;
  if (data && data.features.length && data.features[0].geometry) {
    coordinates = data.features[0].geometry.coordinates[0];
    console.log('MapPanel.vue handleDrawFinish is running, coordinates:', coordinates, 'e:', e);
    if (e && e.target.innerText === 'Finish') {
      coordinates.splice(coordinates.length-2, 1);
      console.log('MapPanel.vue handleDrawFinish, button was clicked, coordinates:', coordinates);
    }
    // setShapeSearchInput is in @phila/vue-datafetch store.js for routing
    DatafetchStore.setShapeSearchInput(data.features[0].geometry.coordinates[0]);
    DatafetchStore.setDrawShape(data.features[0].geometry.coordinates[0]);
  }
  MapStore.draw.trash();
  MapStore.setDrawStart(false);
};
// handleDrawButtonClick() {
//   console.log('MapPanel.vue handleDrawButtonClick is running');
// },

const handleMapMove = (e) => {
  console.log('handleMapMove is firing, MapStore.map:', MapStore.map, 'MapStore.map:', MapStore.map);
  const map = MapStore.map;
  const center = map.getCenter();
  const { lat, lng } = center;
  const coords = [ lng, lat ];

  const zoom = map.getZoom();
  watchedZoom.value = zoom;

  const cyclomediaConfig = config.cyclomedia || {};

  if (cyclomediaConfig.enabled) {
    // update cyclo recordings
    updateCyclomediaRecordings();
    MapStore.setCyclomediaLatLngFromMap([ lat, lng ]);
  }
};

const identifyRow = (featureId) => {
  console.log("identifyRow starting", featureId);
  let rowId;
  if (DatafetchStore.geocode.status === "success" && DatafetchStore.lastSearchMethod !== 'shape search' && DatafetchStore.lastSearchMethod !== 'buffer search') {
    // console.log(DatafetchStore.geocode.data)
    let pwd_parcel_id = Number(DatafetchStore.geocode.data.properties.pwd_parcel_id);
    // console.log("opa_account_num: ", pwd_parcel_id, "featureId: ", featureId)
    rowId = pwd_parcel_id === featureId ? DatafetchStore.geocode.data._featureId : null;
    // console.log("rowId from geocode success: ", rowId)
  } else if (DatafetchStore.ownerSearch.status === "success" && DatafetchStore.lastSearchMethod !== 'shape search' && DatafetchStore.lastSearchMethod !== 'buffer search') {
    let result = DatafetchStore.ownerSearch.data.filter( function(object) {
      // console.log("object.properties.pwd_parcel_id: ", object.properties.pwd_parcel_id, "featureId: ", featureId)
      return Number(object.properties.pwd_parcel_id) === featureId;
    });
    rowId = result[0]._featureId;
  }  else if (DatafetchStore.blockSearch.status === "success" && DatafetchStore.lastSearchMethod !== 'shape search' && DatafetchStore.lastSearchMethod !== 'buffer search') {
    let result = DatafetchStore.blockSearch.data.filter( function(object) {
      // console.log("object.properties.pwd_parcel_id: ", object.properties.pwd_parcel_id, "featureId: ", featureId)
      return Number(object.properties.pwd_parcel_id) === featureId;
    });
    rowId = result[0]._featureId;
  } else if (DatafetchStore.shapeSearch.status === "success") {
    let result = DatafetchStore.shapeSearch.data.rows.filter( function(object){
      return object.pwd_parcel_id === featureId;
    });
    if(typeof result[0] != 'undefined') {
      rowId = result[0]._featureId;
    } else {
      // console.log("rowId = null")
      rowId = null;
    }
  } else {
    // console.log("rowId = null")
    rowId = null;
  }
  // console.log("rowId: ", rowId)
  return rowId;
};

const getTableFromComps = (comps, tableId) => {
  const matchingComps = comps.filter(comp => {
    return (
      comp.type === 'horizontal-table' &&
      comp._id == tableId
    );
  }) || [];
  return matchingComps[0];
};

const getConfigForTable = (tableId) => {
  const topics = config.topics || [];

  for (let topic of topics) {
    const comps = topic.components || [];

    // try outer comps
    const table = getTableFromComps(comps, tableId);

    if (table) {
      return table;
    }

    // try inner comps
    for (let comp of comps) {
      const options = comp.options || {};

      const innerComps = options.components || options.tables || [];

      if (innerComps.length > 0) {
        const innerTable = getTableFromComps(innerComps, tableId);
        // console.log('table on 2nd try', innerTable, innerComps);

        if (innerTable) {
          return innerTable;
        }
      }
    }
  }
};

const handleMarkerMouseover = () => {
  throttle(function (e) {
    // handleMarkerMouseover(e) {
    // console.log('handleMarkerMouseover is starting');
    if (!isMobileOrTablet.value) {
      // console.log('handleMarkerMouseover actions are running, e.target.options:', e.target.options);
      // const { target } = e;
      console.log('handleMarkerMouseover, e:', e, 'e.mapboxEvent:', e.mapboxEvent, 'e.mapboxEvent.features[0].properties.parcelId:', e.mapboxEvent.features[0].properties.parcelId);
      // const featureId  = identifyRow(target.options.data.PARCELID);
      let value = e.mapboxEvent.features[0].properties.parcelId;
      // const featureId  = identifyRow(e.layerId);
      const featureId  = identifyRow(value);
      // console.log('featureId: ', featureId, "target: ", target);
      MainStore.setActiveFeature({ featureId });
    }
  }, 20,)
};

const handleMarkerMouseout = (e) => {
  if (!isMobileOrTablet.value) {
    console.log('handleMarkerMouseout is starting, e:', e);
    let value = e.component.source.data.properties.featureId;
    console.log('handleMarkerMouseout is starting, e:', e, 'value:', value);
    // if (!isMobileOrTablet.value) {
    // console.log('handleMarkerMouseout actions are running');
    // const { target } = e;
    if (DatafetchStore.lastSearchMethod == 'geocode' || activeFeature.value.featureId === value) {
      MainStore.setActiveFeature(null);
    }
  }
};

const mapPanelClass = computed(() => {
  let value = '';
  if (MainStore.leftPanel) {
    value += 'map-panel-left-panel';
  } else {
    value += 'map-panel-data-panel';
  }
  if (MapStore.cyclomediaOn || MapStore.eagleviewOn) {
    value +='-cyclomedia-eagleview';
  }
  return value;
});

</script>

<template>
  <div
    id="map-panel"
    :class="mapPanelClass"
  >
    <!-- <full-screen-map-toggle-tab /> -->
    <Map />
  </div>
  
</template>

<!-- <style lang="scss">

  .top-button-1 {
    top: 0px;
  }

  .top-button-2 {
    top: 46px;
  }

  .top-button-3 {
    top: 92px;
  }

  .top-button-4 {
    top: 138px;
  }

  .map-panel-class {
    // display: inline-block
    position: relative;
  }

  .map-panel-class-50 {
    position: relative;
    height: 50% !important;
  }

  #map-tag {
    height: 100%;
  }

  button.pvm-search-control-button {
    // background: color(dark-ben-franklin) !important;
  }

  .pvm-search-control-input {
    // border-color: color(dark-ben-franklin) !important;
  }


  @media print {
    .print-hide {
      display: none;
    }
  }

  // CSS FOR LARGE SCREEN APP
  @media screen and (min-width: 750px) {

    // .map-div {
    //   height: 100%;
    // }
    //
    // .map-div-cyclo {
    //   height: 100%;
    // }
    #map-panel-container {
      position: relative;
    }

    // .leaflet-bar {
    //   button, a.leaflet-draw-draw-polygon {
    //     font-family: 'Montserrat';
    //     font-weight: 600;
    //   }
    // }

    // .leaflet-nearleft2.non-mobile-corner {
    //   position: absolute;
    //   bottom: 0px;
    //   top: -1px;
    //   left: 370px;
    //   // left: 420px;
    //   padding-bottom: 10px;
    //   z-index: 500;
    // }

    // .leaflet-nearleft2.mobile-corner {
    //   position: absolute;
    //   bottom: 0px;
    //   padding-bottom: 10px;
    //   z-index: 500;
    //   right: 10px !important;
    //   top: 132px !important;
    // }

    // .leaflet-almostbottom {
    //   position: absolute;
    //   bottom: 90px;
    //   left: 0px;
    //   padding-bottom: 10px;
    //   z-index: 500;
    // }

    // .leaflet-almostright {
    //   position: absolute;
    //   top: 0px;
    //   right: 60px;
    //   padding-bottom: 10px;
    //   z-index: 500;
    // }

    // .leaflet-touch .leaflet-draw-toolbar .leaflet-draw-draw-polygon {
    //   background-position: -65px -9px;
    //   background-size: 540px 60px;
    // }

    // BUFFER TOOL
    // the .mobile-button class is at the same level as leaflet-bar...
    .mobile-button {
      width: 34px !important;
      height: 34px !important;
    }

    .mobile-button > button {
      width: 30px !important;
      height: 30px !important;
    }

    .mobile-button > button > span > svg {
      padding-top: 3px !important;
      height: 24px;
      left: -3px;
      top: 2px;
      position: absolute;
    }

    // DRAW TOOL
    // this sets the size of the outer button for the draw tool
    .mobile-corner > div > div > .leaflet-draw-toolbar.leaflet-bar.leaflet-draw-toolbar-top {
      width: 34px !important;
      height: 34px !important;
    }

    .non-mobile-corner > div > div > .leaflet-draw-toolbar.leaflet-bar.leaflet-draw-toolbar-top {
      height: 49px !important;
    }

    // this anchor tag comes from the draw control, and can't be accessed or changed
    .mobile-corner > div > div > div> a {
      width: 30px !important;
      height: 30px !important;
    }

    .non-mobile-corner > div > div > div> a {
      width: 230px !important;
      height: 45px !important;
    }

    .mobile-corner > div > div > div > .leaflet-draw-draw-polygon {
      background-position: -73px -15px !important;
    }

    .leaflet-touch .leaflet-draw-actions {
      left: 230px;
    }

    .leaflet-bar button {
      padding: inherit !important;
    }


    //CSS for search buttons

    // .leaflet-bar.leaflet-draw-toolbar>a.leaflet-draw-draw-polygon,
    // .leaflet-bar.leaflet-control.buffer-control button,
    // .leaflet-bar.leaflet-control.leaflet-draw button,
    // .leaflet-bar.leaflet-control.buffer-control .leaflet-buffer-actions,
    // .leaflet-draw-actions {
    //   border-radius: 0;
    // }

    // .leaflet-bar.leaflet-control.buffer-control :focus,
    // .leaflet-bar.leaflet-control.leaflet-draw :focus {
    //   outline: none;
    // }

    // .leaflet-control-container div .pvm-container-non-mobile,
    // div.buffer-control.leaflet-bar.inactive-buffer-button,
    // div.leaflet-draw.leaflet-bar.inactive-buffer-button,
    // div.buffer-control.leaflet-bar.inactive-draw-button,
    // div.leaflet-draw.leaflet-bar.inactive-draw-button,
    // .inactive-draw-button .leaflet-draw .leaflet-draw-section {
    //   &:hover:after {
    //     font-family: "Open Sans" !important;
    //     background: #d3d3d3;
    //     align-items: center;
    //     opacity: 0.8;
    //     display: flex;
    //     color: #000;
    //     padding: 7px;
    //     // margin-left: -50px;
    //   }
    // }

    // .leaflet-control-container>div{
    //   // width: 100%;
    //   .pvm-container-non-mobile {
    //     &:hover:after {
    //       content: "Enter an address, property acct #, or registry map #. Type “block:” before the address to search by block.";
    //       height: 100%;
    //       width: 100%;
    //       min-width: 350px;
    //       position: absolute;
    //       left: 295px;
    //     }
    //   }
    // }

    // div.buffer-control.leaflet-bar.inactive-buffer-button {
    //   &:hover:after {
    //     content: "Select a point on the map to show all parcels within 250-foot radius.";
    //     font-size: 12px;
    //     width: 213%;
    //     height: 45px;
    //   }
    // }

    // div.buffer-control.leaflet-bar div.leaflet-buffer-actions,
    // div.leaflet-draw.leaflet-bar div.leaflet-buffer-actions,
    // // .leaflet-draw-section .leaflet-draw-actions {
    // div.leaflet-draw-actions {
    //   font-family: 'Open Sans';
    //   background: #d3d3d3;
    //   margin-left: 2px;
    //   opacity: 0.8;
    //   top: 0px !important;
    //   left: 207px;
    //   height: 45px;
    //   ul, li, a {
    //     height: inherit;
    //     color: #000;
    //   }
    //   li:not(:first-child) {
    //     border-left: 1px solid #AAA;
    //     border-left-width: 1px;
    //     border-left-style: solid;
    //     border-left-color: rgb(170, 170, 170);
    //   }
    //   a {
    //     background-color: transparent;
    //     border: none;
    //   }
    // }

    // div.buffer-control.leaflet-bar,
    // div.leaflet-draw.leaflet-bar {
    //   display: flex;
    //   border: none;
    //   button{
    //     min-width: 209px !important;
    //   }
    //   button.inactive.pointer {
    //     // background-color: color(dark-ben-franklin);
    //     span>svg {
    //       color: white;
    //     }
    //   }
    //   button.active {
    //       background-color: white;
    //       min-width: 199px;
    //       // border: 2px solid color(dark-ben-franklin);
    //       // span>svg { color: color(dark-ben-franklin);
    //       }
    //       &:after {
    //         background: white;
    //         // color: color(dark-ben-franklin);
    //       }
    //   }
      // button {
      //   min-width: 198px;
      //   display: flex;
      //   span {
      //     margin-left: 5px;
      //     }
      //   &:hover{
      //     display: flex;
      //   }
      //   &:after {
      //     // content: "Select Radius";
      //     font-weight: normal;
      //     padding: 3px 10px 0 10px;
      //     position: relative;
      //     color: white;
      //     align-items: center;
      //   }
      // }
      .leaflet-buffer-actions {
        left: 197px;
        li {
          padding: 0;
        }
        ul, li, a {
          line-height: 45px;
          text-align: center;
        }
      }
      .leaflet-draw-actions {
        left: 238px;
        li {
          padding-left: 8px;
          padding-right: 8px;
        }
        ul {
          padding-left: 3px;
          padding-right: 3px;
        }
        ul, li, a {
          line-height: 45px;
        }
      }
    }

    // .inactive-draw-button .leaflet-draw .leaflet-draw-section {
    div.leaflet-draw.inactive-draw-button {
      &:hover:after {
        content: "Draw a shape on the map.";
        font-size: 12px;
        // width: 68%;
        // width: 200px;
        height: 45px;
      }
    }

    .leaflet-draw.leaflet-control .leaflet-draw-section .leaflet-draw-draw-polygon,
     div.buffer-control.leaflet-bar button {
      &:after {
        text-transform: uppercase;
        font-size: 16px;
        line-height: 35px;
      }
    }

    // .leaflet-draw.leaflet-control {
    //   display: flex;
    //   .leaflet-draw-draw-polygon {
    //     width: 100%;
    //     height: 100%;
    //   }
    //   .leaflet-draw-section {
    //     display: flex;
    //     .leaflet-draw-toolbar {
    //       border: none;
    //     }
    //     a.leaflet-draw-toolbar-button-enabled {
    //       max-height: 45px;
    //       background-color: white !important;
    //       border: 2px solid color(dark-ben-franklin);
    //       background-image: url("../assets/search-button-images/spritesheet-2-blue.png") !important;
    //       &:after {
    //         padding: 3px 8px 3px 8px;
    //         background: white !important;
    //         padding-top: 4px;
    //         padding-bottom: 2px;
    //         color: color(dark-ben-franklin);
    //       }
    //     }
    //     .leaflet-draw-draw-polygon {
    //       background-image: url("../assets/search-button-images/spritesheet-2-white.png");
    //       background-color: color(dark-ben-franklin);
    //       &:after {
    //         content: "Draw Boundaries";
    //         padding: 5px 10px 5px 10px;
    //         color: white;
    //         font-weight: normal !important;
    //         background: color(dark-ben-franklin);
    //         display: flex;
    //         align-items: center;
    //         margin-left: 40px;
    //       }
    //     }
    //     .leaflet-draw-actions {
    //       left: 227px;
    //       height: 45px;
    //       a {
    //         top: 15%;
    //         position: relative;
    //       }
    //     }
    //   }
    // }
  // }
  // END OF CSS FOR LARGE SCREEN APP


  // CSS FOR SMALL SCREEN APP
  @media screen and (max-width: 750px) {

    .height-50 {
      height: 50%;
    }

    // .leaflet-control-zoom, .leaflet-control-zoom {
    //   display: none !important;
    // }

    // .leaflet-control-container>.leaflet-top.leaflet-left {
    //   right: 0;
    // }

    // .buffer-control, .leaflet-draw {
    //   position: absolute;
    //   right: 0;
    //   // bottom: 0px;
    //   // padding-bottom: 10px;
    //   // z-index: 500;
    // }

    // .buffer-control {
    //   top: 78px;
    //   left: unset;
    // }

    .leaflet-draw {
      position: absolute;
      right: 0;
      top: 138px;
    }

    // .mobile-corner.leaflet-almostright {
    //   position: absolute;
    //   top: 50px;
    //   right: 60px;
    //   padding-bottom: 10px;
    //   z-index: 500;
    // }

    // .leaflet-almostbottom {
    //   position: absolute;
    //   bottom: 10px;
    //   left: 0px;
    //   padding-bottom: 10px;
    //   z-index: 500;
    // }

    // BOTH TOOLS
    // .leaflet-draw-toolbar.leaflet-bar.leaflet-draw-toolbar-top,
    // .leaflet-bar.easy-button-container.leaflet-control {
    //   width: 36px !important;
    //   height: 36px !important;
    //   margin-right: 10px;
    // }

    // BUFFER TOOL
    .leaflet-bar.easy-button-container.leaflet-control > button {
      // width: 26px !important;
      // height: 26px !important;
    }

    // DRAW TOOL
    // .leaflet-draw-draw-polygon {
    //   width: 26px !important;
    //   height: 26px !important;
    // }

    // .leaflet-touch .leaflet-draw-toolbar .leaflet-draw-draw-polygon {
    //   background-position: -31px -1px;
    // }

    // IMAGERY AND CYCLOMEDIA BUTTONS
    // .button-state > img {
    //   height: 26px;
    // }

    // CYCLOMEDIA BUTTON
    // .leaflet-touch .leaflet-bar button {
    //   line-height: unset;
    // }
  }
  // END OF CSS FOR SMALL SCREEN APP


</style>


<style scoped>

  input:focus, select:focus, textarea:focus, button:focus {
  outline: none;
  }

  .surrounding-div {
    height: 100%;
  }

  .mb-map-loading-mask {
    position: absolute;
    top: 0;
    height: 100%;
    width: 100%;
    background: rgba(0, 0 ,0 , 0.25);
    z-index: 999;
    text-align: center;
    vertical-align: middle;
  }

  .left-fifteen {
    left: 15%;
  }

  .left-forty {
    left: 40%;
  }

  .mb-map-loading-mask-inner {
    position: absolute;
    top: 40%;
  }

  /*small retina*/
  @media
  (-webkit-min-device-pixel-ratio: 2),
  (min-resolution: 192dpi),
  (max-width: 39.9375em) {
    .mb-search-control-input {
      max-width: 250px;
    }
  }

</style> -->
