<script setup>

import { ref, computed, watch, onMounted } from 'vue';

import { useMainStore } from '@/stores/MainStore.js';
const MainStore = useMainStore();

import PopoverLink from './PopoverLink.vue';

const props = defineProps({
  options: {
    type: Object,
    required: true,
  },
  item: {
    type: Object,
    required: false,
  },
  slots: {
    type: Object,
    required: false,
  },
  fields: {
    type: Array,
    required: true,
  },
  hasOverlay: {
    type: Boolean,
    required: false,
  },
  tableId: {
    type: String,
    required: false,
  },
  shouldBeBold: {
    type: Boolean,
    required: false,
  },
  totalRowField: {
    type: String,
    required: false,
  },
});

const throttle = (func, timeFrame) => {
  var lastTime = 0;
  return function (...args) {
      var now = new Date();
      if (now - lastTime >= timeFrame) {
          func(...args);
          lastTime = now;
      }
  };
};

// directives: {
//   colspan: {
//     inserted: function (el, binding) {
//       // console.log('colspan directive running, el', el, 'binding:', binding, 'binding.value:', binding.value, 'binding.expression:', binding.expression);
//       if (binding.value.isCondo && binding.value.columnLabel === binding.value.options.column) {
//         // console.log('colspan inserted if, binding:', binding);
//         el.setAttribute('colspan', binding.value.options.span);
//         el.setAttribute('style', 'padding: unset');
//       } else if (binding.value.isCondo && binding.value.columnValue === 'Not Applicable') {
//         // console.log('colspan inserted else, binding:', binding);
//         el.remove();
//       }
//     },
//   },
// },

const showFieldLabel = ref(false);
const mouseover = ref(false);
    
// computed

// i18nEnabled() {
//   let value = $config.i18n && $config.i18n.enabled;
//   return value;
// },

const isCondo = computed(() => {
  let value;
  if (props.item.condo) {
    value = true;
  } else {
    value = false;
  }
  return value;
});

const fullScreenTopicsOrTable = computed(() => {
  // if ($config.dataPanelWidth !== 'undefined') {
  //   if ($store.state.fullScreenTopicsEnabled || $store.state.fullScreen.topicsOnly || $config.dataPanelWidth === 'whole') {
  //     return true;
  //   }
  // } else {
  //   if ($store.state.fullScreenTopicsEnabled || $store.state.fullScreen.topicsOnly) {
  //     return true;
  //   }
  // }
  return false;
});

const activeFeature = computed(() => {
  return MainStore.activeFeature;
});

const isActive = computed(() => {
  let value;
  if (mouseover.value) {
    value = true;
  } else if (activeFeature.value) {
    if (props.item._featureId) {
      value = activeFeature.value.featureId === props.item._featureId || activeFeature.value.featureId === parseInt(props.item._featureId.toString().slice(0,6));
      // value = activeFeature.value.featureId === props.item._featureId && props.tableId === activeFeature.value.tableId;
    } else {
      value = false;
    }
  }
  return value;
});

const customClass = computed(() => {
  // console.log("customClass: ", this)
  return typeof props.options.customClass != 'undefined'
    && typeof props.options.customClass.tr != 'undefined' ?
    props.options.customClass.tr : '';
});

// const customStyle = computed(() => {
//   // console.log("customStyle: ", this)
//   return typeof customStyle != 'undefined'
//     && typeof customStyle != 'undefined' ?
//     customStyle : '';
// });

const isMobileOrTablet = computed(() => {
  return MainStore.isMobileOrTablet;
});

watch (
  () => isActive,
  (value) => {
    if (value === true) {
      // const el = $el;
      const el = document.getElementsByClassName('row')[0];
      const visible = isElementInViewport(el);
      // console.log('horizontaltablerow WATCH isActive is firing, el:', el, 'visible:', visible);

      // console.log('visible?', visible ? 'YES' : 'NO');

      if (!visible && !MainStore.horizontalTables.mouseover) {
        el.scrollIntoView({ block: 'center' });
      }
    }
  }
);

onMounted(() => {
  // console.log('horizontaltablerow created');
  window.addEventListener('resize', handleWindowResize);
  handleWindowResize();
});

// methods
// const handleRowMouseover: throttle(function (e) {
//   // console.log('handleRowMouseover is starting');
//   if(!isMobileOrTablet.value && !props.options.mouseOverDisabled) {
//     // console.log('handleRowMouseover actions are running');
//     if (!props.hasOverlay) {
//       return;
//     }

//     const featureId = props.item._featureId;
//     const tableId = tableId;
//     $store.commit('setActiveFeature', { featureId, tableId });
//     $store.commit('setHorizontalTableMouseover', true);
//     $data.mouseover = true;
//   }
// }, 100,
// );

const handleRowMouseover = (e) => {
  // console.log('handleRowMouseover is starting');
  if(!isMobileOrTablet.value && !props.options.mouseOverDisabled) {
    // console.log('handleRowMouseover actions are running');
    if (!props.hasOverlay) {
      return;
    }

    const featureId = props.item._featureId;
    const tableId = props.tableId;
    MainStore.setActiveFeature({ featureId, tableId });
    MainStore.setHorizontalTableMouseover(true);
    mouseover.value = true;
  }
};

const handleRowClick = (e) => {
  // console.log('handleRowClick is running, e:', e);
  if(MainStore.activeModal && props.options.clickEnabled ) {
    // console.log('handleRowClick is running');
    if (!props.hasOverlay) {
      return;
    }
    const featureId = props.item._featureId;
    if(props.item.condo != true){
      MainStore.setActiveFeature({ featureId });
      MainStore.setActiveModal({ featureId });
    }
    if( typeof props.options.rowAction != 'undefined' ) {
      props.options.rowAction(props.item);
    }
    mouseover.value = false;
  } else if (isMobileOrTablet.value || props.options.mouseOverDisabled) {
    // console.log('handleRowClick actions are running');
    if (!props.hasOverlay) {
      return;
    }
    const featureId = props.item._featureId;
    const tableId = props.tableId;
    MainStore.setActiveFeature({ featureId, tableId });
  }
};

const handleRowMouseout = (e) => {
  if(!isMobileOrTablet.value) {
    // console.log('handleRowMouseout actions are running');
    if (MainStore.activeModal) {
      if(!props.options.mouseOverDisabled && MainStore.activeModal.featureId === null) {
        if (!props.hasOverlay) {
          return;
        }
        MainStore.setActiveFeature(null);
        MainStore.setHorizontalTableMouseover(false);
        mouseover.value = false;
      }
    } else if (!props.options.mouseOverDisabled) {
      // console.log('handleRowMouseout !props.options.mouseOverDisabled:', !props.options.mouseOverDisabled);
      if (!props.hasOverlay) {
        return;
      }
      MainStore.setActiveFeature(null);
      MainStore.setHorizontalTableMouseover(false);
      mouseover.value = false;
    }
  }
};

const mobileIcon = (value) => {
  // console.log("There is an icon field: ", window.innerWidth)
  if (window.innerWidth < 750) {
    return typeof value != 'undefined' ? ' ' + value : '';
  }
  return '';
};

// REVIEW there's very similar code in pvd. if these can be
// the same thing, make it into a util.
const isElementInViewport = (el) => {
  const rect = el.getBoundingClientRect();
  // console.log('bounding box', rect);
  const visibility = {
    // TODO the 108 below is account for the combined height of the
    // app header and address header. this is not a good long-term
    // solution - instead, use the `bottom` value of the address header's
    // bounding rect. however, this should only fire on small devices,
    // which would require again hard-coding screen breakpoints from
    // standards or some other magic, which might not a huge
    // improvement in terms of decoupling logic and presentation. hmm.
    top: rect.top >= 108,
    left: rect.left >= 0,
    bottom: rect.bottom <= (window.innerHeight || document.documentElement.clientHeight),
    right: rect.right <= (window.innerWidth || document.documentElement.clientWidth),
  };
  // return if all sides are visible
  return Object.values(visibility).every(val => val);
};

const featuresMatch = (a, b) => {
  return a.featureId === b.featureId && a.tableId === b.tableId;
};

const handleWindowResize = () => {
  if (window.innerWidth >= 750) {
    showFieldLabel.value = false;
  } else {
    showFieldLabel.value = true;
  }
};

const evaluateFieldLabel = (label) => {
  console.log('evaluateFieldLabel, label:', label);
  if (showFieldLabel.value && props.totalRowField !== label.toLowerCase()) {
    return label;
  }
  return '';
};

const addColon = () => {
  if (showFieldLabel.value) {
    return ': ';
  } else {
    return ''
  }
};

const evaluateSlot = (valOrGetter, transforms = [], nullValue = '') => {
  // console.log('evaluateSlot is running, props.item:', props.item, 'valOrGetter:', valOrGetter);
  // check for null val/getter
  if (!valOrGetter) {
    return valOrGetter;
  }

  const valOrGetterType = typeof valOrGetter;
  let val;

  // fn
  if (valOrGetterType === 'function') {
    // const state = $store.state;
    // const controller = $controller;
    const getter = valOrGetter;

    // const getterText = String(getter);
    // const depsRe = /state(\.\w+)+/g;
    // const depsText = getterText.match(depsRe);
    // const deps = depsText.map(eval);

    const item = props.item;
    // console.log('in evaluateSlot, item:', item);

    // if this comp is associated with an "item" (generally some object
    // from a list of things, e.g. dor parcels), pass the item itself
    // as well when evaluating
    if (item) {
      val = getter(item);
    } else {
      // console.log('evaluateSlot, about to get value');
      val = getter();
      // console.log('state:', state, 'val:', val);
    }
  } else {
    val = valOrGetter;
  }

  // format nulls but not falses
  if (val === false) {
    // no action
  // } else if (!val) {
  //   return nullValue;
  // }
  } else if (!transforms.includes('currency') && !val) {
    return nullValue;
  }

  // apply transforms
  // for (let transformKey of transforms) {
  //   // get transform definition from config by name
  //   const transform = $config.transforms[transformKey];
  //   // make object of (relevant) globals by filtering window object
  //   let globals;
  //   const globalKeys = transform.globals;
  //   if (globalKeys) {
  //     globals = Object.keys(window)
  //       .filter(key => globalKeys.includes(key))
  //       .reduce((obj, key) => {
  //         obj[key] = window[key];
  //         return obj;
  //       }, {});
  //   }
  //   // run transform
  //   const fn = transform.transform;
  //   val = fn(val, globals);
  // }

  return val;
};

</script>

<template>
  <tr
    :class="customClass + ' ' + [ isActive == true ? 'active' : '' ]"
    @mouseover="handleRowMouseover"
    @click="handleRowClick"
    @mouseleave="handleRowMouseout"
  >
    <td
      v-for="(field, index) in fields"
      :key="index"
      v-colspan="{columnLabel:field.label, columnValue: evaluateSlot(field.value), isCondo, options:$props.options.colSpan}"
      :sorttable_customkey="[field.customKey ? evaluateSlot(field.customKey) : evaluateSlot(field.value)]"
      :class="[
        typeof field.customClass !== 'undefined'? field.customClass : '',
        options.inPopover? 'in-popover': '',
        !fullScreenTopicsOrTable? 'half-screen-table-cell': ''
      ]"
    >
      <!-- <topic-component-group
        :topic-components="field.components"
        :item="item"
      /> -->
      <b v-show="shouldBeBold">
        <popover-link
          v-if="field.popoverLink"
          :slots="field"
          :item="item"
          :field-label="field.label"
        />
        <div
          v-if="!i18nEnabled && !field.popoverLink"
          v-html="evaluateFieldLabel(field.label) + addColon() + evaluateSlot(field.value, field.transforms, field.nullValue)"
        />
        <div
          v-if="i18nEnabled && !field.popoverLink"
          v-html="$t(evaluateFieldLabel(field.label)) + addColon() + evaluateSlot(field.value, field.transforms, field.nullValue)"
        />
      </b>

      <!-- Total Row -->
      <div v-show="!shouldBeBold">
        <popover-link
          v-if="field.popoverLink"
          :slots="field"
          :item="item"
          :field-label="field.label"
        />
        <div>
          <div
            v-if="!i18nEnabled && !field.popoverLink"
            :style="field.customStyle"
            v-html="evaluateFieldLabel(field.label) + addColon() + evaluateSlot(field.value, field.transforms, field.nullValue)"
          />
          <div
            v-if="i18nEnabled && !field.popoverLink"
            :style="field.customStyle"
            v-html="$t(evaluateFieldLabel(field.label)) + addColon() + evaluateSlot(field.value, field.transforms, field.nullValue)"
          />

          <font-awesome-icon
            v-if="mobileIcon(field.mobileIcon)"
            v-show="evaluateSlot(field.hideMobileIcon)"
            :icon="field.mobileIcon"
            aria-hidden="true"
            style="margin-left: 5px"
          />
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
@import 'phila-standards/dist/css/phila-app.min.css';

.active {
  background: #F3D661;
}

td {
  font-size: 15px;
  text-align: left;
  word-wrap: break-word;
}

.in-popover {
  color: #000;
}

/* .half-screen-table-cell {
  max-width: 300px;
} */

</style>
