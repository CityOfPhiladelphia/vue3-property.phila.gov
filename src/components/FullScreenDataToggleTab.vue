
<script setup>

import { ref, computed, onMounted, watch } from 'vue';

import { useMainStore } from '@/stores/MainStore';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore';
const MapStore = useMapStore();

onMounted(() => {
  setYPosition(MainStore.windowDimensions.height);
  setXPosition(MainStore.windowDimensions.width);
})

const buttonY = ref(0);
const buttonX = ref(0);

watch(
  () => MainStore.windowDimensions,
  newWindowDimensions => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('newWindowDimensions.height:', newWindowDimensions.height);
    setYPosition(newWindowDimensions.height);
    setXPosition(newWindowDimensions.width);
  }
)

// const fullScreenMapEnabled = computed(() => {
//   return MainStore.fullScreenMapEnabled;
// });

const fullScreenDataEnabled = computed(() => {
  return MainStore.fullScreenDataEnabled;
});

const isMobileOrTablet = computed(() =>{
  return MainStore.isMobileDevice;
});

const cyclomediaActive = computed(() => {
  return MapStore.cyclomediaOn;
});

const eagleviewActive = computed(() => {
  return MapStore.eagleviewOn;
});

const picOrCycloActive = computed(() => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('cyclomediaActive:', cyclomediaActive, 'eagleviewActive:', eagleviewActive);
  if (cyclomediaActive.value || eagleviewActive.value) {
    return true;
  }
  return false;
});

watch (
  () => picOrCycloActive.value,
  () => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('newPicOrCycloActive:', newPicOrCycloActive);
    setYPosition(MainStore.windowDimensions.height);
    setXPosition(MainStore.windowDimensions.width);
  }
)

const currentIcon = computed(() => {
  if (fullScreenDataEnabled.value) {
    return 'caret-left';
  }
  return 'caret-right';
});
  
const setYPosition = (dim) => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('setYPosition dim:', dim, typeof dim);
  if (!picOrCycloActive.value) {
    buttonY.value = (dim-48)/2 + 'px';
  } else {
    buttonY.value = (dim-48)/4 + 'px';
  }
}

const setXPosition = async (dim) => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('setXPosition dim:', dim, typeof dim);
  if (fullScreenDataEnabled.value) {
    buttonX.value = '0px';
  } else {
    buttonX.value = dim/2 + 'px';
  }
}

const handleFullScreenDataToggleButtonClick = () => {
  const prevfullScreenDataEnabled = MainStore.fullScreenDataEnabled;
  const nextfullScreenDataEnabled = !prevfullScreenDataEnabled;
  MainStore.fullScreenDataEnabled = nextfullScreenDataEnabled;
  if (nextfullScreenDataEnabled) {
    buttonX.value = '0px';
  } else {
    buttonX.value = MainStore.windowDimensions.width/2 + 'px';
  }
  window.dispatchEvent(new Event('resize'));
}

</script>

<template>
  <button
    v-if="!isMobileOrTablet"
    id="data-toggle-tab"
    :title="fullScreenDataEnabled ? 'Show Map Panel' : 'Hide Map Panel'"
    :style="{ top: buttonY, right: buttonX }"
    class="toggle-tab"
    tabindex="0"
    @click="handleFullScreenDataToggleButtonClick"
  >
    <!-- <span class="align-span"> -->
    <font-awesome-icon
      :icon="currentIcon"
      class="fa-2x"
    />
    <!-- </span> -->
  </button>
</template>

<style scoped>

  .toggle-tab {
    display: none;
    padding-top: 9px;
    cursor: pointer;
  }

  .align-span {
    margin-left: 6px;
    margin-top: 30px;
  }

  @media screen and (min-width: 768px) {
    .toggle-tab {
      position: absolute;
      /* right: 0px; */
      border-width: 1.3px;
      border-style: solid;
      border-color: #CAC9C9;
      height: 48px;
      /* line-height: 56px !important; */
      width:24px;
      background-color: white;
      display: inline-block;
      z-index: 500;
      opacity: 0.7;
      padding-top: 2px;
    }
  }

</style>
