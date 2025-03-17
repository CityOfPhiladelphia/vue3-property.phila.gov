<script setup>

import { onMounted, onBeforeMount, onBeforeUnmount, computed, watch, nextTick } from 'vue';

import MapPanel from './components/MapPanel.vue';
import DataPanel from './components/DataPanel.vue';
import LeftPanel from './components/LeftPanel.vue';
import CollectionSummary from './components/CollectionSummary.vue';
import Logo from '@/assets/city-of-philadelphia-logo.png';

import { useMainStore } from '@/stores/MainStore.js';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();
import { useDatafetchStore } from '@/stores/DatafetchStore.js';
const DatafetchStore = useDatafetchStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js';
const GeocodeStore = useGeocodeStore();

if (!import.meta.env.VITE_PUBLICPATH) {
  MainStore.publicPath = '/';
} else {
  MainStore.publicPath = import.meta.env.VITE_PUBLICPATH;
}
if (import.meta.env.VITE_DEBUG == 'true') console.log('import.meta.env.VITE_PUBLICPATH:', import.meta.env.VITE_PUBLICPATH, 'MainStore.publicPath:', MainStore.publicPath);

// ROUTER
import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

import isMobileDevice from './util/is-mobile-device';

const props = defineProps({
  appLogo: {
    type: String,
    default: Logo,
  },
});

// DATA
const publicPath = '@/assets/';
let top = 3;
let bottom = 2;
let hasData = false;
// let leftPanel = true;
let isMapVisible = true;


// COMPUTED
const leftPanel = computed(() => {
  return MainStore.leftPanel;
});

const isLarge = computed(() => {
  return MainStore.isLarge;
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

const currentScreenPercent = computed(() => {
  let value;
  if (!isLarge) {
    value = 1;
  } else {
    value = 2;
  }
  return value;
});

const lastSearchMethod = computed(() => {
  return MainStore.lastSearchMethod;
});

const activeModal = computed(() => {
  return MainStore.activeModal.featureId;
});

const activeModalFeature = computed(() => {
  if (!activeModal) {
    console.log('App.vue activeModalFeature computed is running but stopping immediately');
    return null;
  }
  let state = MainStore;
  let feature = null;
  if ([ 'geocode', 'reverseGeocode', 'address' ].includes(lastSearchMethod.value)) {
    if (GeocodeStore.related != null && GeocodeStore.related.length && GeocodeStore.aisData._featureId != MainStore.activeModal.featureId ) {
      console.log('first if is running');
      feature = GeocodeStore.related.filter(object => {
        return object._featureId === MainStore.activeModal.featureId;
      })[0];
    } else if (Object.keys(GeocodeStore.aisData).length) {
      console.log('second if is running');
      feature = GeocodeStore.aisData;
    }
  } else if (state.lastSearchMethod === 'owner search' || state.lastSearchMethod === 'block search' ) {
    let searchValue = state.lastSearchMethod === 'owner search' ? "ownerSearch" : "blockSearch"
    console.log('in computed activeModalFeature, state.lastSearchMethod:', state.lastSearchMethod, 'searchValue:', searchValue);
    if (state[searchValue].data) {
      feature = state[searchValue].data.filter(object => {
        return object._featureId === state.activeModal.featureId;
      })[0];
    }
  } else if ([ 'shape search', 'buffer search' ].includes(state.lastSearchMethod)) {
    // console.log('App.vue computed activeModalFeature is running after buffer search');
    if (state.shapeSearch.data) {
      feature = state.shapeSearch.data.rows.filter(object => {
        return object._featureId === state.activeModal.featureId;
      })[0];
    }
  }
  console.log('activeModalFeature computed is running, feature:', feature);
  return feature;
});

// const popoverOpen = computed(() => {
//   return MainStore.popover.open;
// });

// const popoverText = computed(() => {
//   return MainStore.popover.text;
// });

// const popoverOptions = computed(() => {
//   return MainStore.popover.options;
// });

const foundItemsLength = computed(() => {
  console.log('App.vue pvd computed foundItemsLength, DatafetchStore.condoUnits.units:', DatafetchStore.condoUnits.units);
  return 1;
  // if (DatafetchStore.shapeSearch.data != null) {
  //   if (Object.keys(DatafetchStore.condoUnits.units).length) {
  //     if (lastSearchMethod !== 'buffer search') {
  //       return 2;
  //     } else {
  //       return 3;
  //     }
  //   }
  //   return DatafetchStore.shapeSearch.data.rows.length;
  // } else if (DatafetchStore.geocode.data != null && DatafetchStore.geocode.data != "") {
  //   let geocodeArray = [];
  //   geocodeArray.push(DatafetchStore.geocode.data.properties);
  //   if (DatafetchStore.geocode.related != null ) {
  //     DatafetchStore.geocode.related.map(a => geocodeArray.push(a));
  //     return geocodeArray.length;
  //   }
  //   if (DatafetchStore.condoUnits.units) {
  //     // return >1
  //     if (lastSearchMethod !== 'buffer search') {
  //       return 2;
  //     } else {
  //       return 3;
  //     }
  //   }
  //   return geocodeArray.length;

  // } else if (DatafetchStore.blockSearch.data != null) {
  //   if (DatafetchStore.condoUnits.units) {
  //     return 2;
  //   }
  //   return DatafetchStore.blockSearch.data.length;
  // }
});

const summaryOptions = computed(() => {
  const options = {
    // dataSources: ['opa_assessment'],
    descriptor: 'parcel',
    // this will include zero quantities
    // includeZeroes: true,
    getValue: function(item) {
      if(item){
        return 1;
      }
    },
    context: {
      singular: function(list, shape) {
        return 'Showing ' + list + ' result.';
      },
      plural: function(list, shape) {
        return 'Showing ' + list + ' results.';
      },
      pluralizeList: false,
    },
    types: [
      {
        value: 1,
        label: '',
      },
    ],
    slots: {
      items: function() {
        if(DatafetchStore.shapeSearch.data != null) {
          return DatafetchStore.shapeSearch.data.rows;
        } else if (GeocodeStore.aisData != null && GeocodeStore.aisData != "") {
          let geocodeArray = [];
          geocodeArray.push(GeocodeStore.aisData.properties);
          if(GeocodeStore.related != null ) {
            GeocodeStore.related.map(a => geocodeArray.push(a));
            return geocodeArray;
          }
          return geocodeArray;

        } else if (DatafetchStore.ownerSearch.data != null) {
          return DatafetchStore.ownerSearch.data;
        } else if (DatafetchStore.blockSearch.data != null) {
          return DatafetchStore.blockSearch.data;
        }
      },
    },
  };
  return options;
});

const currentErrorType = computed(() => {
  let error = null;
  if (anySearchStatus === 'error'){
    error = 'search';
  } else if (DatafetchStore.shapeSearch.status === 'too many') {
    error = 'too_many';
  } else if ( typeof DatafetchStore.geocode.data != 'undefined' &&
                DatafetchStore.geocode.data != null &&
                DatafetchStore.geocode.data.ais_feature_type === 'intersection') {
    error = 'intersection';
  } else if (anySearchStatus === 'condoWaiting') {
    error = 'condoWaiting';
  }
  return error;
});

const errorMessage = computed(() => {
  let error = currentErrorType;
  let returnValue;
  // console.log('error: ', error)
  if (error === 'search' | error === 'intersection') {
    returnValue = '<h3>No account found matching that address.<h3>';
  } else if (error === 'too_many') {
    returnValue = '<h3>Too many parcels selected.  Try again.<h3>';
  } else if (error === 'condoWaiting') {
    returnValue = '<h3>Collecting condo data.  Please wait.<h3>';
  }
  return returnValue;
});

const drawShape = computed(() => {
  return MapStore.drawShape;
});

const geocodeStatus = computed(() => {
  return GeocodeStore.geocodeStatus;
  // return DatafetchStore.geocode.status;
});

const condoStatus = computed(() => {
  return DatafetchStore.condoUnits.status;
});

const ownerSearchStatus = computed(() => {
  return DatafetchStore.ownerSearch.status;
});

const ownerSearchTotal = computed(() => {
  return DatafetchStore.ownerSearch.total_size
});

const blockSearchStatus = computed(() => {
  return DatafetchStore.blockSearch.status;
});

const shapeSearchStatus = computed(() => {
  return DatafetchStore.shapeSearch.status;
});

const anySearchStatus = computed(() => {
  let statusArray = [ geocodeStatus.value, ownerSearchStatus.value, shapeSearchStatus.value, condoStatus.value, blockSearchStatus.value ];
  console.log('statusArray:', statusArray);
  let status;
  if (statusArray.includes('waiting')) {
    if (condoStatus === 'waiting') {
      status = 'condoWaiting'
    } else {
      status = 'waiting';
    }
  } else if (statusArray.includes('success')) {
    status = 'success';
  } else if (statusArray.includes('error')) {
    status = 'error';
  }
  return status;
});

const fullScreenMapEnabled = computed(() => {
  return MainStore.fullScreenMapEnabled;
});

const fullScreenDataEnabled = computed(() => {
  return MainStore.fullScreenDataEnabled;
});

const tableClass = computed(() => {
  return fullScreenMapEnabled.value ? 'bottom-none medium-auto':
    fullScreenDataEnabled.value ? 'bottom-full medium-auto':
      'bottom-half medium-auto';
});

const summaryClass = computed(() => {
  return fullScreenMapEnabled ? 'bottom-none': "";
});

// const shouldKeepLeftPanel = computed(() => {
//   if (!MainStore.leftPanel) {
//     // console.log('App.vue shouldKeepLeftPanel if');
//     return false;
//   }
//   // console.log('App.vue shouldKeepLeftPanel outside if');
//   return true;
// });

const shouldLoadCyclomediaWidget = computed(() => {
  return $config.cyclomedia.enabled;
  // return $config.cyclomedia.enabled && !isMobileOrTablet;
});

const cyclomediaActive = computed(() => {
  return MainStore.cyclomedia.active;
})

const cycloLatlng = computed(() => {
  if (MainStore.cyclomedia.orientation.xyz !== null) {
    const xyz = MainStore.cyclomedia.orientation.xyz;
    return [ xyz[1], xyz[0] ];
  }
  const center = $config.map.center;
  return center;
});

const cycloRotationAngle = computed(() => {
  return MainStore.cyclomedia.orientation.yaw * (180/3.14159265359);
})

const cycloHFov = computed(() => {
  return MainStore.cyclomedia.orientation.hFov;
});

const opa = computed(() => {
  return MainStore.sources.opa_assessment;
});

const opaStatus = computed(() => {
  if (opa && opa.status) {
    return opa.status;
  }
  return null;
});

// WATCH
watch(
  () => shapeSearchStatus.value,
  (nextShapeSearchStatus) => {
  if (nextShapeSearchStatus === 'too many') {
    onDataChange();
  }
});

watch(
  () => geocodeStatus.value,
  (nextGeocodeStatus) => {
  console.log('watch geocodeStatus, nextGeocodeStatus:', nextGeocodeStatus);
  if (nextGeocodeStatus === 'success') {
    let geocodeType;
    if (GeocodeStore.aisData) {
      geocodeType = GeocodeStore.aisData.search_type;
    }
    if (foundItemsLength.value === 1 && MapStore.bufferMode === false && geocodeType !== 'intersection') {
      onDataChange('oneItem');
    } else {
      console.log('App.vue pvd watch geocodeStatus is calling onDataChange with multiItem');
      onDataChange('multiItem');
    }
  } else if (nextGeocodeStatus === 'error' && lastSearchMethod === 'reverseGeocode') {
    console.log('App.vue watch geocodeStatus is error, lastSearchMethod:', lastSearchMethod);
    onDataChange();
  }
});

watch(
  () => blockSearchStatus.value,
  (nextBlockSearchStatus) => {
  console.log('watch blockSearchStatus, nextBlockSearchStatus:', nextBlockSearchStatus);
  if (nextBlockSearchStatus === 'error') {
    console.log('blockSearchError');
    // let geocodeType;
    // if (MainStore.geocode.data) {
    //   geocodeType = MainStore.geocode.data.ais_feature_type;
    // }
    // if (foundItemsLength === 1 && MainStore.bufferMode === false && geocodeType !== 'intersection') {
    //   onDataChange('oneItem');
    // } else {
    onDataChange('multiItem');
    // }
  }
});

// watch(
//   () => leftPanel.value,
//   () =>{
//   // console.log("intro page watcher: ", leftPanel)
//   leftPanel === false ? closeModal() : ""
// });

watch(
  () => activeModal.value,
  () => {
  // console.log('watch activeModal is firing');
  if (MainStore.activeModal.featureId !== null) {
    // console.log('open panel - MainStore.activeModal.featureId !== null:', MainStore.activeModal.featureId);
    openLeftPanel(true);
  } else {
    // console.log('close panel - MainStore.activeModal.featureId is null:', MainStore.activeModal.featureId);
    openLeftPanel(false);
  }
});

watch(
  () => drawShape.value,
  (nextDrawShape) => {
  if (nextDrawShape !== null) {
    // $controller.handleDrawnShape();
    // MainStore.commit('setShapeSearchStatus', 'waiting');
  }
});

watch(
  () => foundItemsLength.value,
  (nextFoundItemsLength) => {
  console.log('watch foundItemsLength is firing, nextFoundItemsLength:', nextFoundItemsLength, 'lastSearchMethod:', lastSearchMethod, 'bufferMode:', MainStore.bufferMode);
  if (!nextFoundItemsLength) {
    return;
  }
  let geocodeType;
  if (MainStore.geocode.data) {
    geocodeType = MainStore.geocode.data.ais_feature_type;
  }
  if (nextFoundItemsLength === 1 && MainStore.bufferMode === false && geocodeType !== 'intersection') {
    onDataChange('oneItem');
  } else {
    console.log('App.vue pvd watch foundItemsLength is calling onDataChange with multiItem, nextFoundItemsLength:', nextFoundItemsLength);
    onDataChange('multiItem');
  }
});

// watch(
//   () => ownerSearchTotal.value,
//   (newValue) => {
//   if( newValue > MainStore.ownerSearch.data.length ){
//     MainStore.setOwnerSearchModal(true);
//   }
// });

// watch(
//   () => ownerSearchStatus.value,
//   (nextOwnerSearchStatus) => {
//   if (nextOwnerSearchStatus === 'waiting') {
//     onDataChange('ownerSearch');
//   }
// });

// watch(
//   () => MainStore.leftPanel,
//   (nextLeftPanel) => {
//   if (nextLeftPanel === false) {
//     leftPanel = false;
//   }
// });

watch(
  () => activeModalFeature.value,
  (nextActiveModalFeature) => {
  console.log('App.vue watch activeModalFeature is firing, nextActiveModalFeature:', nextActiveModalFeature);
  if (nextActiveModalFeature) {
    MainStore.setActiveModalFeature(nextActiveModalFeature);
    // $controller.activeFeatureChange();
  }
});

onMounted(async () => {
  //Adding this function as an event listener so that it can be used to clear when property modal errors on open as well.
  MainStore.isMobileDevice = isMobileDevice();
  window.addEventListener("keydown", function(e) {
    return e.keyCode === 27 ? closePropertyModal() : "";
  }.bind(this), false);
  // onResize();
  DatafetchStore.setActiveParcelLayer('pwd');
  // reactToRoute();
  handleWindowResize();
});

// METHODS

const handleWindowResize = () => {
  const rootElement = document.getElementById('app');
  const rootStyle = window.getComputedStyle(rootElement);
  const rootWidth = rootStyle.getPropertyValue('width');
  const rootHeight = rootStyle.getPropertyValue('height');
  const rootWidthNum = parseInt(rootWidth.replace('px', ''));
  const rootHeightNum = parseInt(rootHeight.replace('px', ''));

  const dim = {
    width: rootWidthNum,
    height: rootHeightNum,
  };
  MainStore.windowDimensions = dim;
}

// const reactToRoute = () => {
//   let query = route.query;
//   console.log('App.vue reactToRoute is running, route.query:', route.query);
//   if (query.shape) {
//     // MainStore.setDrawShape(query.shape);
//     onDataChange('shapeSearch');
//   } else if (query.address) {
//     closePropertyModal();
//     MainStore.setLeftPanel(false);
//     // console.log('query.address:', query.address);
//     onDataChange('geocode');
//   } else if (query.owner) {
//     closePropertyModal();
//     MainStore.setLeftPanel(false);
//     // console.log('query.owner:', query.owner);
//     onDataChange('ownerSearch');
//   } else if (query.buffer) {
//     closePropertyModal();
//     MainStore.setLeftPanel(false);
//     MainStore.setBufferMode(true);
//     onDataChange('bufferSearch');
//     MainStore.setLastSearchMethod('buffer search');
//   } else if (query.block) {
//     closePropertyModal();
//     MainStore.setLeftPanel(false);
//     // console.log('query.owner:', query.owner);
//     onDataChange('blockSearch');
//   } else if (query.p) {
//   }
// };

const closePropertyModal = async() => {
  MainStore.activeModal.featureId = null;
  MainStore.setActiveFeature(null);
  await nextTick();
  MainStore.map.resize();
};

const openLeftPanel = (value) => {
  console.log('App.vue openLeftPanel is running, value:', value);
  // leftPanel = value
  MainStore.setLeftPanel(value);
  // MainStore.setFullScreenMapEnabled(!value);
};

// anything this still does should move to index.js
const onDataChange = (type) => {
  if (type !== 'oneItem') {
    console.log('onDataChange if is running pvd router, type:', type, 'lastSearchMethod:', lastSearchMethod);
    hasData = true;
    MainStore.setFullScreenMapEnabled(false);
    closePropertyModal();
    MainStore.setLeftPanel(false);
    if (lastSearchMethod === 'block search') {
      $controller.setRouteByBlockSearch(MainStore.blockSearch.input);
    } else if (lastSearchMethod === 'shape search') {
      $controller.setRouteByShapeSearch();
    } else if (lastSearchMethod === 'buffer search') {
      console.log('App.vue onDataChange is calling pvd router setRouteByBufferSearch');
      $controller.setRouteByBufferSearch();
    } else {
      $controller.setRouteByGeocode();
    }
  } else {
    console.log('onDataChange else is running, type:', type, 'lastSearchMethod:', lastSearchMethod);
    if (['shape search', 'buffer search'].includes(lastSearchMethod)) {
      MainStore.setActiveFeature({ featureId: 'feat-shape-0' });
      MainStore.setActiveModal({ featureId: 'feat-shape-0' });
    } else if (['block search', 'blockSearch'].includes(lastSearchMethod)) {
      console.log('onDataChange else is running, type:', type, 'lastSearchMethod is block search');
      MainStore.setActiveFeature({ featureId: 'feat-block-0' });
      MainStore.setActiveModal({ featureId: 'feat-block-0' });
    } else {
      // console.log('onDataChange else else is running, GeocodeStore.aisData.properties.opa_account_num):', GeocodeStore.aisData.properties.opa_account_num);
      // MainStore.setActiveFeature', { featureId: 'feat-geocode-0' });
      MainStore.setActiveFeature(null);
      MainStore.setActiveModal({ featureId: 'feat-geocode-0' });
    }
    hasData = true;
    // MainStore.setFullScreenMapEnabled(true);
    MainStore.setLeftPanel(true);
  }
};

const clearResults = (value) => {
  console.log('clearResults');
  const prevFullScreenMapEnabled = MainStore.FullScreenMapEnabled;
  const nextFullScreenMapEnabled = !prevFullScreenMapEnabled;
  MainStore.setFullScreenMapEnabled(nextFullScreenMapEnabled);
};

// const onResize = () => {
//   if (window.innerWidth > 749) {
//     isMapVisible = true;
//     // isLarge = true;
//     MainStore.setIsLarge(true);
//   } else {
//     // isLarge = false;
//     MainStore.setIsLarge(false);
//   }
// };

const toggleModal = () => {
  toggleBodyClass('no-scroll');
};

const showModal = () => {
  toggleBodyClass('no-scroll');
};

// const closeModal = () => {
//   toggleBodyClass('no-scroll');
// };

const toggleBodyClass = (className) => {
  const el = document.body;
  return isOpen ? el.classList.add(className) : el.classList.remove(className);
};

const links = [
  {
    type: 'native',
    href: 'https://phila.formstack.com/forms/atlas_feedback_form',
    text: 'Feedback',
    attrs: {
      target: '_blank',
    },
  },
];

const mainRowClass = computed(() => {
  return leftPanel.value ? 'top-full':
    fullScreenMapEnabled.value ? 'top-full':
    fullScreenDataEnabled.value ? 'top-none':
      'top-half';
});

const mapPanelHolderClass = computed(() => {
  if (leftPanel.value) {
    return 'map-panel-holder';
  } else {
    return 'map-panel-holder-full-width';
  }
});

const leftPanelHolderClass = computed(() => {
  if (leftPanel.value) {
    return 'left-panel-holder';
  } else {
    return 'left-panel-holder-hidden';
  }
});

// const mainRowClass = computed(() => {
//   return 'main-row-full';
// });

</script>

<template>
  <a
    href="#main"
    class="skip-to-main-content-link"
  >Skip to main content</a>

  <app-header
    app-title="Property"
    app-link="/"
    :is-sticky="true"
    :is-fluid="true"
  >
    <template #mobile-nav>
      <mobile-nav :links="links" />
    </template>
  </app-header>

  <div
    id="main"
    class="main invisible-scrollbar"
  >

    <div
      id="main-column"
      class="main-column invisible-scrollbar"
    >
      <div
        v-show="!fullScreenDataEnabled"
        id="main-row"
        :class="'main-row ' + mainRowClass"
      >
        <!-- LEFT PANEL ON LEFT -->
        <div
          v-if="!isMobileDevice() && MainStore.windowDimensions.width > 768 && !fullScreenMapEnabled"
          :class="leftPanelHolderClass"
        >
        <!-- :class="fullScreenDataEnabled ? 'left-panel-holder-full' : ''" -->
          <left-panel
            :foundItemsLength="foundItemsLength"
          />
        </div>

        <div
          :class="mapPanelHolderClass"
        >
        <!-- v-show="!fullScreenDataEnabled" -->
        <!-- :class="fullScreenMapEnabled ? 'left-panel-holder-full' : ''" -->
          <map-panel />
        </div>

      </div> <!-- end of main-row -->

      <div
        id="results-summary"
        :class="summaryClass"
      >
        <div
          v-show="currentErrorType !== null"
          v-html="errorMessage"
        />

        <collection-summary
          v-if="anySearchStatus === 'success'"
          :options="summaryOptions"
          :slots="summaryOptions.slots"
        />

        <div
          v-if="anySearchStatus === 'success'"
          id="clear-results"
          @click="clearResults"
        >
          <a>
            <u><b> Clear search</b></u>
          </a>
        </div>

        <button class="button is-pulled-right"></button>
        <button class="button is-pulled-right"></button>

      </div>
        
      <div :class="tableClass">
        <data-panel />
      </div>
    </div> <!-- end of main-column -->

  </div> <!-- end of main -->

  <!-- FOOTER -->
  <app-footer
    :is-sticky="true"
    :is-hidden-mobile="true"
    :links="links"
  />

  <!-- <popover
    v-if="popoverOpen"
    :options="popoverOptions"
    :slots="{'text': popoverText}"
  /> -->
  <!-- </div> -->
</template>

<style lang="scss">

// button {
//   cursor: pointer;
// }

// .toggle-map{
//   margin:0 !important;
// }

// .main-content{
//   position: relative;
// }

// .top-full {
//   position: relative;
//   top: 0;
//   bottom: 0;
// }

// .no-scroll{
//   overflow: hidden;
//   height: 100vh;
// }
// .toggle-map{
//   position: fixed;
//   bottom:0;
//   width: 100%;
//   z-index: 900;
// }

// .step-group{
//   .step-label {
//     display: inline-block;
//     background: black;
//     color:white;
//     text-align: center;
//   }
//   .step{
//     border-left:1px solid black;

//     &:last-of-type {
//       border:none;
//     }

//     .step-title{
//       font-size:1.2rem;
//     }
//   }
// }

// #app {
//   height: 100%;
// }

#clear-results {
  display: inline-block !important;
  margin-left: 10px;
  font-size: 14px;
}

#collection-summary {
  display: inline-block !important;
}

#data-panel-container .pvc-horizontal-table .pvc-horizontal-table-body .stack>thead>tr>th {
  position: sticky;
  top: -2px !important;
  z-index: 2;
  border-left:1px solid white;
}

#results-summary{
  height: 45px;
  padding: 8px 0px  0px 10px;
  margin: 0 2px 0 2px;
  background-color: #f0f0f0;
  border-style: solid;
  border-color: #0f4d90;
  border-width: 2px 0 0 0 ;
}

// .logo {
//   line-height: 4em;
//   padding-left: 10px;
//   width: auto;
// }

// .bottom-full {
//   overflow-y: auto;
//   flex: 1;
// }

.bottom-half {
  overflow-y: auto;
  flex: 2;
}

// .bottom-none {
//   // overflow-y: auto;
//   // flex: 0;
//   // display: none;
// }

.condo-button {
  background-color: #5555;
  height: 100%;
  width: 100%;
  text-transform: unset;
  font-family: "Open Sans", Helvetica, Roboto, Arial, sans-serif;
  font-weight: 600;
  padding: 10.5px 0 10.5px 0;
}

// .leaflet-top, .leaflet-bottom {
//   z-index: 999 !important;
// }

// .modal-opacity {
//   opacity: 0.2;
// }

// .pvc-horizontal-table-controls {
//   margin-bottom: 0 !important;
// }

// .pvc-horizontal-table-body {
//   padding-top: 0 !important;
//   margin-top: 0 !important;
// }

// .pointer {
//   cursor: pointer;
// }

.top-half {
  // flex: 3;
  height: 50%;
}

.top-full {
  flex: 1;
}

.top-none {
  flex: 0;
}

.bottom-half #data-panel-container .pvc-horizontal-table .pvc-horizontal-table-body .pvc-export-data-button {
  clear:both;
  z-index: 999;
  top: calc(60% - 7px);
  // right: 70px;
}
.bottom-full #data-panel-container .pvc-horizontal-table .pvc-horizontal-table-body .pvc-export-data-button {
  clear:both;
  z-index: 999;
  top: 93px;
}

// @media print {

//   .grid-y.medium-grid-frame#application {
//     overflow: visible;
//   }

//   #map-panel-container {
//     overflow: visible;
//   }

//   #results-summary {
//     display: none;
//   }

//   @page {
//     margin-top: .5in;
//     size: 8.5in 11in;
//   }

// }

// @media screen and (min-width: 46.875em) {

//   body {
//     overflow: hidden;
//   }

// }

@media screen and (max-width: 750px) {

  // #map-panel-container {
  //   height: 400px;
  // }

  // #cyclomedia-container {
  //   height: 200px
  // }


  // .main-content{
  //   position: inherit;
  // }

  // .pl-alert {
  //   height: 100% !important;
  // }

  // .pl-alert-body {
  //   width: 100% !important;
  // }

  // .pl-alert-close-button {
  // color: lightgrey !important;

  // }

  // #demo-badge {
  //   top: 25%;
  //   width: max-content;
  // }

  // #demo-container {
  //   padding-left: 15px;
  //   position: relative;
  // }


  // .pvc-download-data-button, .pvc-export-data-button {
  //   visibility: hidden;
  // }

  // .leaflet-draw-actions {
  //     left: 42px !important;
  // }

  // .logo {
  //   margin-top: auto;
  //   margin-bottom: auto;
  // }

  // .app-header .cell .shrink {
  //   width: 100%;
  // }

  // .app-divide {
  //   margin-bottom: 0;
  //   border: none;
  // }

  // .app-title {
  //   font-family: 'Montserrat';
  //  h2 {
  //   font-size: 13px!important;
  //   letter-spacing: 2.5px;
  //   font-weight: 200;
  //  }
  // }

  // .mobile-menu-content {
  //   position: fixed;
  //   bottom: 0;
  //   width: 100%;
  // }

  #results-summary{
    height: 35px;
    padding: 8px 0px  0px 10px;
    margin: 0 2px 0 2px;
    color: rgb(15, 77, 144);
    background-color: #cfcfcf;
    border-style: solid;
    border-color: #0f4d90;
    border-width: 1px 0 1px 0 ;
  }


  thead {
    display: none;
  }

//   td {
//     clear: both;
//     border: none !important;
//   }

//   th {
//     border: 1px solid white !important;
//     font-size: unset !important;
//   }

//   tbody th, tbody td {
//     padding: 0.28571rem 0.35714rem 0.35714rem;
//   }

//   td div svg {
//     float: right
//   }

// }

// .step-group{
//   .step-label {
//     display: inline-block;
//     background: black;
//     color:white;
//     text-align: center;
//   }
//   .step{
//     border-left:1px solid black;

//     &:last-of-type {
//       border:none;
//     }

//     .step-title{
//       font-size:1.2rem;
//     }
//   }
}

</style>
