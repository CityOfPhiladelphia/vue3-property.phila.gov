<script setup>

import generateUniqueId from '../util/unique-id';

import ButtonComp from './ButtonComp.vue';

import { defineProps, computed, ref } from 'vue';

const $emit = defineEmits(['handle-topic-header-click', 'get-more-records', 'close-popover']);

const props = defineProps({
  topicComponents: {
    type: Object,
    required: true,
  },
  item: {
    type: Object,
    required: true,
  },
  filterData: {
    type: Object,
    required: false,
  },
  isList: {
    type: Boolean,
    required: false,
    default: false,
  },
});

// generate a (basically) unique id for the group. the go-to npm packages
// for uuid generation aren't available as umd builds on unpkg and
// therefore won't work with the examples. this is good enough :)
const key = generateUniqueId();

// computed
const topicComponentsComp = computed(() => {
  if (props.topicComponents) {
    let value = [];
    for (let comp of props.topicComponents) {
      // console.log('TopicComponentGroup.vue, topicComponentsComp computed, comp:', comp);
      let hide = false
      if (comp.options && comp.options.hide) {
        const items = comp.slots.items();
        // console.log('hide topicComponentsComp computed, items:', items, 'comp.options.hide(items):', comp.options.hide(items));
        hide = comp.options.hide(items);
      }
      // console.log('topicComponentsComp, comp:', comp, 'hide:', hide);
      if (!hide) {
        value.push(comp);
      }
    }
    return value;
  }
});

// methods
const getCompKey = (compGroupKey, compIndex) => {
  return `topic-comp-${compGroupKey}-${compIndex}`;
};

const handleTopicHeaderClick = (nextTopic) => {
  // console.log('TopicComponentGroup handleTopicHeaderClick is running');
  $emit('handle-topic-header-click', nextTopic);
};

const getMoreRecords = (dataSource, highestPageRetrieved) => {
  // console.log('TopicComponentGroup getMoreRecords is running, dataSource:', dataSource, 'highestPageRetrieved:', highestPageRetrieved);
  $emit('get-more-records', dataSource, highestPageRetrieved);
};

const closePopover = () => {
  console.log('TopicComponentGroup closePopover is running');
  $emit('close-popover');
};


</script>

<template>
  <div>
    <div v-if="!isList">
      <button-comp
        v-for="(comp, compIndex) in topicComponentsComp"
        :key="getCompKey(key, compIndex)"
        :slots="comp.slots"
        :options="comp.options"
        :item="item"
        class="topic-component"
        @handle-topic-header-click="handleTopicHeaderClick"
        @get-more-records="getMoreRecords"
        @close-popover="closePopover"
      />
    </div>
    <div v-if="isList">
      <li
        v-for="(comp, compIndex) in topicComponentsComp"
        :key="compIndex"
      >
        <component
          :is="comp.type"
          :key="getCompKey(key, compIndex)"
          :slots="comp.slots"
          :options="comp.options"
          :item="item"
          class="topic-component"
          @handle-topic-header-click="handleTopicHeaderClick"
          @get-more-records="getMoreRecords"
          @close-popover="closePopover"
        />
      </li>
    </div>
  </div>
</template>

<style scoped>
  .topic-component {
    /* margin-bottom: 10px !important; */
  }
</style>
