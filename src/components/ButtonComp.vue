<script setup>

// import TopicComponent from './TopicComponent.vue';
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  slots: {
    type: Object,
    default: () => {}
  },
  options: {
    type: Object,
    default: () => {}
  },
  item: {
    type: Object,
    required: false,
  },
});


const clicked = ref(false);
  
// computed
const message = computed(() => {
  let value;
  if (props.slots) {
    value = evaluateSlot(props.slots.text);
  }
  return value;
});

const className = computed(() => {
  let value;
  if (props.options) {
    value = evaluateSlot(props.options.class) || '';
  }
  return value;
});

const style = computed(() => {
  let value;
  if (props.options) {
    value = evaluateSlot(props.options.style) || '';
  }
  return value;
});

// methods
const clickAction = () =>{
  evaluateSlot(props.slots.buttonAction);
  props.options.stopClickedChange ? "" : clicked.value = true;
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
  <a
    :class="'button ' + className + ' clicked-' + clicked"
    :style="style"
    href="#"
    @click.prevent="clickAction"
    v-html="message"
  />
</template>

<style scoped>

  .clicked-true {
    display: none;
  }

</style>
