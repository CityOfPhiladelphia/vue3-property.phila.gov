<script setup>

import { useMainStore } from '@/stores/MainStore.js';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();
import { useDatafetchStore } from '@/stores/DatafetchStore.js';
const DatafetchStore = useDatafetchStore();

import FullScreenDataToggleTab from '@/components/FullScreenDataToggleTab.vue';

import { computed, onUnmounted } from 'vue';

import PropertyCard from './PropertyCard.vue';

const props = defineProps({
  foundItemsLength: {
    type: Number,
    default: 1,
  },
});

const condoUnitsStatus = computed(() => {
  return DatafetchStore.condoUnits.status;
});

const loadingData = computed(() => {
  return DatafetchStore.loadingData;
});

const activeAddressKnown = computed(() => {
  return MainStore.activeAddressKnown;
});

const map = computed(() => {
  return MapStore.map.map;
});

const isMobileOrTablet = computed(() => {
  return MainStore.isMobileOrTablet;
});

const sitePath = computed(() => {
  if (import.meta.env.VITE_PUBLICPATH) {
    return window.location.origin + import.meta.env.VITE_PUBLICPATH;
  }
  return '';
});

// onUnmounted(async() => {
  // console.log('intro page destroyed is running');
  // this.map.invalidateSize();
  // MapStore.map.resize();
// })

const leftPanelClass = computed(() => {
  // if (MapStore.cyclomediaOn || MapStore.eagleviewOn) {
  return 'left-panel-class';
  // } else {
  //   return 'left-panel-class-data-open';
  // }
  // if (isMobileOrTablet.value) {
  //   return 'left-panel mobile';
  // } else {
  //   return 'left-panel';
  // }
});


</script>

<template>
  <div
    id="intro-container"
    :class="leftPanelClass"
  >
    <!-- v-show="loadingData" -->
    <div
      v-show="MainStore.activeModal.featureId != null && !activeAddressKnown || condoUnitsStatus == 'waiting'"
      class="loading-mask"
    >
      <font-awesome-icon
        icon="spinner"
        size="6x"
        aria-hidden="true"
        spin
      />
    </div>

    <property-card
      v-show="MainStore.activeModal.featureId !== null"
      :foundItemsLength="foundItemsLength"
    />

    <div
      v-if="MainStore.activeModal.featureId === null"
      class="introduction"
    >
      <div class="intro-blue">
        <i>Use the Property App to get information about a property's ownership,
        sales history, value, and physical characteristics. You can also generate address
        listings near a property or within an area of interest.</i>
      </div>
      <h2>To get started, you can: </h2>
      <div class="spacer" />
      <div>
        <ul class="padded-list fa-ul">
          <li> <span class="fa-li"><i class="far fa-hand-rock"></i></span>
            <h4>Select a location on the map</h4>
            Click or tap on a specific property to view details about it.
          </li>
          <li> <span class="fa-li"><i class="fas fa-search"></i></span>
            <h4>Search on property information</h4>
            Type an address, property account number, or
            Department of Records registry map number into the search box.
            Enter "block:" before the address to find all properties on the block.
            <p class="red">*Property Search is no longer allowing Search By Owner due to privacy concerns.</p>
          </li>
          <li> <span class="fa-li"><i class="fas fa-circle"></i></span>
            <h4>View properties within a selected radius</h4>
            Use this tool to select a point on the map and view details about all
            properties within a 250-foot radius.
          </li>
          <li>
            <h4>View properties within drawn boundaries</h4>
            Use this tool to draw a shape on the map and view details about all
            properties within its boundaries.
          </li>
        </ul>
      </div>
    </div>

  </div>
</template>

<style lang="scss">

.left-panel-holder {
  height: calc(100vh - 110px);
  overflow-y: visible;
}

.inline-block {
  display: inline-block;
}

.warning {
  display: flex;
  div.icon {
    margin-top: auto;
    margin-bottom: auto;
  }
  .fa-exclamation-triangle{
    margin-right: 10px;
  }
}

#intro-container {
  height: 100%;
  overflow-y: visible;
}

.loading-mask {
  position: absolute;
  top: 0;
  height: 450%;
  width: 100%;
  background: rgba(0, 0 ,0 , 0.5);
  z-index: 1000;
  text-align: center;
  vertical-align: middle;
  padding-top: 250px;
}

.intro-red {
  color: black;
  background: #fed0d0;
  padding: 10px;
}

.intro-blue {
  background: #daedfe;
  padding: 10px;
}

.red {
  color: #cc3000;
  padding-top: 5px;
}

.spacer {
  height: 15px;
}

@media print {
  #intro-container {
    overflow-y: visible;
  }
  .grid-x > #intro-container.medium-12 {
    width: 100%;
  }
  #ownerProperties, #salesHistory {
   thead>tr,  tbody>tr  {
      display: revert;
      td, th {
        display: revert;
      }
    }

  }
}

@media screen and (min-width: 750px) {
  #intro-container {
    position: relative;
      overflow-y: auto;
  }
  .introduction {
    padding: 38px 46px 0 46px;
    .intro-blue {
        margin: 0 0 24px 0;
    }
  }
}

@media screen and (max-width: 750px) {
  .introduction {
    padding: 28px 28px 0 28px;
  }
}

.full-topics-open {
  display: none;
}

</style>
