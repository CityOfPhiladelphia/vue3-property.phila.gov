<script setup>

import { computed, watch, onMounted, defineProps, ref } from 'vue';

// import useTransforms from '@/composables/useTransforms';
// const { date, integer, prettyNumber } = useTransforms();

import { useOpaStore } from '@/stores/OpaStore.js';
const OpaStore = useOpaStore();

import TopicComponent from './TopicComponent.vue';
import ButtonCompLight from './ButtonCompLight.vue';
import HorizontalTableRow from './HorizontalTableRow.vue';
// import ExternalLink from './ExternalLink.vue';
import { format, subHours, addHours, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths, subYears, addYears, isWithinInterval, parseISO } from 'date-fns';

const emit = defineEmits(['get-more-records']);

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
})


import jsPDF from 'jspdf';
import autotable from 'jspdf-autotable';
// import chunk from 'lodash-es/chunk';

const DEFAULT_SORT_FIELDS = [
  'distance',
  'date',
];

// mixins: [ TopicComponent, ButtonCompLight ]

// const filters = ref([]);
// filters.value = props.options.filters;
// const filtersKeys = Object.keys(filters);
// console.log('in horiz table data, filters:', filters, 'filtersKeys:', filtersKeys);
// const defaultFilterSelections = Object.keys(filters).reduce((acc, i) =>
//                                 {
//                                   const key = `filter-${i}`;
//                                   console.log('in reduce, i:', i, 'acc:', acc, 'key:', key, 'acc[key]:', acc[key]);
//                                   acc[key] = {};
//                                   return acc;
//                                 }, {});
let defaultFilterSelections = {};

// let tableGroupId = item.tableGroupId;
// console.log('Object.keys($store.state.horizontalTableGroups[tableGroupId].activeFilterValues).length:', Object.keys($store.state.horizontalTableGroups[tableGroupId].activeFilterValues).length);
// if (tableGroupId && tableGroupId != 'undefined' && $store.state.horizontalTableGroups && Object.keys($store.state.horizontalTableGroups[tableGroupId].activeFilterValues).length > 0) {
//   // console.log('setting filter to:', $store.state.horizontalTableGroups[tableGroupId].activeFilterValues);
//   defaultFilterSelections['filter-0'] = $store.state.horizontalTableGroups[tableGroupId].activeFilterValues;
// } else {

// }

// console.log('in horiz table data, filters:', filters, 'filtersKeys:', filtersKeys, 'defaultFilterSelections:', defaultFilterSelections);
let sortFields = ref([]);
if (props.options.sort){
  sortFields.value = props.options.sort.sortFields;
}

const highestRowRetrieved = ref(props.options.defaultIncrement);
const searchText = ref('');
const filterSelections = ref(defaultFilterSelections);
const sortField = ref();

if (sortFields.length) {
  sortField.value = sortFields[0];
} else {
  sortField.value = DEFAULT_SORT_FIELDS[0];
}

// const initialData = {
//   filterSelections: defaultFilterSelections,
//   searchText: '',
//   // sortField,
//   highestRowRetrieved,
// };

// computed
// const i18nEnabled = computed(() => {
//   let value = $config.i18n && $config.i18n.enabled;
//   return value;
// });

const buttonPositionClass = computed(() => {
  let value;
  if (props.options.export.buttonPosition) {
    if (props.options.export.buttonPosition === 'right') {
      value = 'pvc-export-data-button-right';
    } else {
      value = 'pvc-export-data-button';
    }
  } else {
    value = 'pvc-export-data-button';
  }
  return value;
});

const totalRowEnabled = computed(() => {
  let value;
  if (props.options.totalRow) {
    value = props.options.totalRow.enabled || false;
  }
  return value;
});

const totalRowField = computed(() => {
  let value;
  if (props.options.totalRow) {
    value = props.options.totalRow.totalField || '';
  }
  return value;
});

const hasData = computed(() => {
  // console.log('horizTable hasData is running, $config:', $config, '$store.state:', $store.state);
  if (!props.options.dataSources) {
    return true;
  }
  const hasData = props.options.dataSources.every(dataSource => {
    // const targetsFn = $config.dataSources[dataSource].targets;
    const targetsFn = OpaStore[dataSource].targets;
    const maybeEmpty = isEmpty(targetsFn);
    // if the data source is configured for targets
    if (!isEmpty(targetsFn)) {
      const targetsMap = OpaStore[dataSource].targets;
      const targets = Object.values(targetsMap);

      // but there are no targets for this address, return false
      if (targets.length === 0) {
        return false;
      }

      // if there are targets for this address, make sure none of them
      // are "waiting"
      return targets.every(target => target.status !== 'waiting');

      // if the data source is not configured for targets, just check that
      // it has data
    }
    return !!OpaStore[dataSource].data;
  });
  return hasData;
});

// this is the start of an added zone
const customElementClass = computed(() => {
  let customCSS;
  if (props.options.customCSS) {
    customCSS = props.options.customCSS;
  }
  return customCSS;
});

// this is the end of an added zone
const shouldShowFilters = computed(() => {
  if (typeof props.options.shouldShowFilters === 'undefined') {
    return true;
  }
  return props.options.shouldShowFilters;
});

const shouldShowHeaders = computed(() => {
  if (typeof props.options.shouldShowHeaders === 'undefined') {
    return true;
  }
  return props.options.shouldShowHeaders;
});

// this is the start of an added zone
const shouldShowExportMailing = computed(() => {
  let shouldExport = false;
  if (props.options.export) {
    if (props.options.export.formatButtons) {
      const keys = Object.keys(props.options.export.formatButtons);
      shouldExport = keys.includes('mailing');
    }
  }
  return shouldExport;
});

// this is the end of an added zone
const shouldShowExportPDF = computed(() => {
  let shouldExport = false;
  if (props.options.export) {
    if (props.options.export.formatButtons) {
      const keys = Object.keys(props.options.export.formatButtons);
      shouldExport = keys.includes('pdf');
    }
  }
  return shouldExport;
});

const shouldShowExportPDFLight = computed(() => {
  let shouldExport = false;
  if (props.options.export) {
    if (props.options.export.formatButtons) {
      const keys = Object.keys(props.options.export.formatButtons);
      shouldExport = keys.includes('pdf-light');
    }
  }
  return shouldExport;
});

const shouldShowExportCSV = computed(() => {
  let shouldExport = false;
  if (props.options.export) {
    if (props.options.export.formatButtons) {
      const keys = Object.keys(props.options.export.formatButtons);
      shouldExport = keys.includes('csv');
    }
  }
  return shouldExport;
});

const secondaryStatus = computed(() => {
  return OpaStore[props.options.id].secondaryStatus;
});

const shouldShowTable = computed(() => {
  let result = true;
  // if the table is in a tab group or table group, it will have an "item" in props
  // if (item) {
  //   // if it is in a table group, the item will contain an "activeTable" for the group
  //   if (item.activeTable) {
  //     const id = props.options.id;
  //     if (item.activeTable != id) {
  //       result = false
  //     }
  //   }
  // }
  // if there is no data, and the table should not show at all if it is empty
  if (props.options.showOnlyIfData && items.value.length === 0) {
    result = false;
  }
  return result;
});

const shouldShowRetrieveButton = computed(() => {
  return highestRowRetrieved.value < count.value;
});

const leftToRetrieve = computed(() => {
  return count.value - highestRowRetrieved.value;
});

const nextIncrement = computed(() => {
  if (!props.options.showAllRowsOnFirstClick) {
    if (leftToRetrieve.value < props.options.defaultIncrement) {
      return leftToRetrieve.value;
    }
    return props.options.defaultIncrement;

  }
  return leftToRetrieve.value;
});

const highestPageRetrieved = computed(() => {
  return evaluateSlot(props.slots.highestPageRetrieved);
});

const pageCount = computed(() => {
  return evaluateSlot(props.slots.pageCount);
});

const totalSize = computed(() => {
  return evaluateSlot(props.slots.totalSize);
});

const limit = computed(() => {
  return props.options.limit;
});

// REVIEW what does this do? can this be simplified?
const inputClass = computed(() => {
  if (searchText.value === '') {
    return 'pvc-search-control-input';
  }
  return 'pvc-search-control-input-full';
});

const filters = computed(() => {
  return props.options.filters;
});

const activeFilters = computed(() => {
  //TODO make this work with not-always-on filters
  return filters.value;
});

const fields = computed(() => {
  return props.options.fields;
});

const hasOverlay = computed(() => {
  return !!props.options.mapOverlay;
});

const items = computed(() => {
  if (hasData.value) {
    const itemsSlot = props.slots.items;
    const items = evaluateSlot(itemsSlot) || [];
    // console.log('horiz table items', items);
    return items;
  }
  return [];
});

const filterByTextFields = computed(() => {
  if (props.options.filterByText) {
    return props.options.filterByText.fields;
  }
  return null;
});

const itemsAfterSearch = computed(() => {
  // console.log('itemsAfterSearch is running');
  // const items = items.value;
  // const searchText = searchText.value;

  if (!searchText.value) {
    return items.value;
  }

  const searchTextLower = searchText.value.toLowerCase();

  // get full set of items

  // if text search is not enabled, return all items
  const searchFields = filterByTextFields.value || [];
  if (searchFields.length === 0) {
    return items.value;
  }

  // get items that contain the search text in one of their filter fields
  const matchingItems = items.value.filter(item => {
    const searchVals = searchFields.map(filterField => {
      const props = item.properties;
      const searchVal = props ? props[filterField] : item[filterField];
      // console.log('props', props, 'searchVal', searchVal);
      return searchVal.toLowerCase();
    });

    let boolean = false;
    for (let searchVal of searchVals) {
      // console.log('searchVal', searchVal, 'searchTextLower', searchTextLower);
      if (searchVal.includes(searchTextLower)) {
        boolean = true;
      }
    }
    return boolean;
  });

  return matchingItems;
});

// this takes itemsAfterSearch and applies selected filters
const itemsAfterFilters = computed(() => {
  // console.log('itemsAfterFilters is running, filters:', filters, 'filterSelections:', filterSelections);
  if (!itemsAfterSearch.value) {
    return [];
  }
  const items = filterItems(itemsAfterSearch.value,
    filters.value,
    filterSelections.value);
  // console.log('horiz table itemsAfterFilters', items);
  return items;
});

const itemsAfterSort = computed(() => {
  // const itemsAfterFilters = itemsAfterFilters.value;
  const sortOpts = props.options.sort;
  return sortItems(itemsAfterFilters.value, sortOpts);
});

// const sortFields = computed(() => {
//   if (props.options.sort.sortFields) {
//     return props.options.sort.sortFields;
//   }
//   return DEFAULT_SORT_FIELDS;
// });

// this takes filtered items and applies the max number of rows
const itemsLimited = computed(() => {
  // console.log('items limited', itemsAfterSort.slice(0, limit));
  if (props.options.limit) {
    return itemsAfterSort.value.slice(0, props.options.limit);
  } else if (props.options.defaultIncrement) {
    return itemsAfterSort.value.slice(0, highestRowRetrieved.value);
  }
  return itemsAfterSort.value;
});

const itemsLimitedSummed = computed(() => {
  let summed = {};
  for (let key of Object.keys(itemsLimited.value[0])) {
    if (typeof itemsLimited.value[0][key] === 'number') {
      summed[key] = 0;
    }
    if (totalRowField.value) {
      summed[totalRowField.value] = 'Total';
    }
    for (let item of itemsLimited.value) {
      if (typeof summed[key] === 'number') {
        summed[key] = summed[key] + item[key];
      }
    }
  }
  return summed;
});

const count = computed(() => {
  if (props.options.useApiCount) {
    return totalSize.value;
  }
  return itemsAfterFilters.value.length;
});

const countText = computed(() => {
  if (props.options.noCount) {
    return '';
  } else if (highestRowRetrieved.value < count.value) {
    return `(1 - ${ count.value < highestRowRetrieved.value ? count.value : highestRowRetrieved.value } of ${count.value})`;
  }
  return `(${count.value})`;
});

const shouldShowExternalLink = computed(() => {
  if (props.options.externalLink.forceShow) {
    return props.options.externalLink.forceShow;
  }
  return itemsAfterSearch.value.length > limit.value;
});

watch(
  () => itemsAfterFilters,
  (nextItems) => {
    console.log('WATCH items after filters, props.options.id:', props.options.id, 'nextItems:', nextItems);
    // $nextTick(() => {

    let tableGroupId = props.item.tableGroupId;
    let activeTableId, activeFilterValues;
    // let theSelect = document.getElementById('time-select');
    console.log('tableGroupId:', tableGroupId);
    // if ($store.state.horizontalTableGroups && tableGroupId && tableGroupId != 'undefined') {
    //   activeTableId = $store.state.horizontalTableGroups[tableGroupId].activeTableId;
    //   activeFilterValues = $store.state.horizontalTableGroups[tableGroupId].activeFilterValues;
    // }
    
    // if ($store.state.horizontalTables) {
    //   updateTableFilteredData();
    //   if ($store.state.horizontalTableGroups && props.options.tableId == activeTableId) {
    //     $store.commit('setHorizontalTableGroupActiveFilters', {
    //       tableGroupId: props.item.tableGroupId,
    //       activeFilterValues: filterSelections['filter-0'],
    //     });
    //   }
    // }
  }
);

onMounted(() => {
  console.log('HorizontalTable onMounted filters.value:', filters.value);

  if (filters.value) {
    for (let index=0; index < filters.value.length; index++) {
      defaultFilterSelections['filter-' + index] = filters[index].values[0];
    }
    for (let [ index, filter ] of filters.value.entries()) {
      const key = `filter-${index}`;
      let defaultValue;
      // let tableGroupId = props.item.tableGroupId;
      let activeTableId, activeFilterValues, activeSortValues;
      // let theSelect = document.getElementById('time-select');
      // if ($store.state.horizontalTableGroups && tableGroupId != 'undefined') {
      //   activeTableId = $store.state.horizontalTableGroups[tableGroupId].activeTableId;
      //   activeFilterValues = $store.state.horizontalTableGroups[tableGroupId].activeFilterValues;
      //   activeSortValues = $store.state.horizontalTableGroups[tableGroupId].activeSortValues;
      // }
      // if ($store.state.horizontalTableGroups && props.options.tableId == activeTableId && Object.keys($store.state.horizontalTableGroups[tableGroupId].activeFilterValues).length > 0) {
      //   console.log('created setting filter to:', $store.state.horizontalTableGroups[tableGroupId].activeFilterValues);
      //   defaultValue = activeFilterValues;
      //   let theSelect = document.getElementById('time-select-'+activeTableId);
      //   // theSelect.value = 'wawa';
      //   theSelect.value = defaultValue.direction + '-' + defaultValue.value + '-' + defaultValue.unit;
      //   // theSelect.selectedIndex = "2";
      //   console.log('created props.options.id:', props.options.id, 'theSelect:', theSelect, defaultValue.direction + '-' + defaultValue.value + '-' + defaultValue.unit);
      // } else {
        defaultValue = filter.values[0] || {};
        // console.log('created theSelect:', theSelect, 'defaultValue:', defaultValue, 'defaultValue.direction:', defaultValue.direction, 'defaultValue.value:', defaultValue.value, 'defaultValue.unit:', defaultValue.unit);
        // theSelect.value = defaultValue.direction + '-' + defaultValue.value + '-' + defaultValue.unit;
        // let theSelect = document.getElementById('time-select-'+activeTableId);
        // theSelect.selectedIndex = "0";
      // }
      console.log('horizontal table mounted, activeSortValues:', activeSortValues);
      filterSelections.value[key] = defaultValue;
      if (activeSortValues) {
        sortField.value = activeSortValues;
        let theSort = document.getElementById('time-sort-'+activeTableId);
        theSort.value = activeSortValues;
      }

      // theSelect.selectedIndex = "1";
    }
  }
  
  // if ($store.state.horizontalTables) {
  //   // updateTableFilteredData();
  //   // $store.commit('setHorizontalTableGroupActiveFilters', {
  //   //   tableGroupId: props.item.tableGroupId,
  //   //   activeFilterValues: filterSelections['filter-0'],
  //   // });
  //   //  is the start of an added zone
  //   if(typeof props.options.customClass != 'undefined') {
  //     if( props.options.customClass.table != 'undefined'
  //           && props.options.customClass.table === 'sortable') {
  //       sorttable.makeSortable($el.querySelector('.sortable'));
  //     }
  //   }
  //   // this is the end of an added zone
  // }
});

// methods
//  is the start of an added zone
const specifySortType = (field) => {
  return props.options.customClass.th(field);
};

const exportTableToMailing = () => {
  const tableData = [];
  let fields = [];
  let totals = {};
  let mailingFields = props.options.mailingFields();
  let labelFields = mailingFields.fields.map(a => a.label);
  let labelValues = mailingFields.fields.map(a => a.value);

  for (let field of labelFields) {
    fields.push(field.label);
    totals[field.label] = 0;
  }

  // if (items.value.length > 0) { } else {
  //   return;
  // }

  if (!items.value.length > 0) {
    return;
  }


  for (let item of items.value) {
    let theArray = [];
    let i = 0;
    for (let field of labelFields) {
      // console.log("field: ", field, "labelValues: ", labelValues, "item: ",  item)
      if (labelValues[i](item) === null) {
        theArray.push('');
      } else {
        theArray.push(labelValues[i](item)) || '';
      }

      if (labelValues[i](item) === null || isNaN(labelValues[i](item))) {
        // if (isNaN(field['value'](item))) {
        // console.log('isnull:', field['value'](item));
        totals[field.label] = '';
      } else {
        // console.log('is not null:', field['value'](item));
        totals[field.label] = totals[field.label] + parseFloat(labelValues[i](item));
      }
      i++;
    }
    tableData.push(theArray);
  }

  // console.log('tableData:', tableData);
  var doc = new jsPDF('p', 'pt', 'letter');
  // console.log("tableData: ", tableData);

  const chunk = (input, size) => {
    return input.reduce((arr, item, idx) => {
      return idx % size === 0
        ? [...arr, [item]]
        : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
  };

  let tableJoin = chunk(tableData.map(a => a.join('\n')),3);
  // console.log("table joined and chunked: ", tableJoin)

  doc.autoTable({
    body: tableJoin,
    content: 'Text',
    startY: 36,
    margin: { top: 36, right: 12, bottom: 36, left: 12 },
    willDrawCell: data => data.section === 'head' ? false : data.cell.height = 72,
    didDrawCell: data => data.row.height= 72,
    styles: { cellWidth: 196, halign: 'center', valign: 'middle', fontSize: 10 },
    alternateRowStyles: { fillColor: 'white' },
    tableWidth: 'wrap',
    rowPageBreak: 'avoid',
  });

  // console.log(doc);

  let filename;
  let fileStart = evaluateSlot(props.options.export.file);
  if (fileStart) {
    filename = evaluateSlot(props.options.export.file) + '.pdf';
  } else {
    filename = 'export.pdf';
  }
  doc.save(filename);
};

// this is the end of an added zone
const exportTableToPDF = () => {
  const tableData = [];
  let fields = [];
  let totals = {};
  for (let field of props.options.fields) {
    fields.push(field.label);
    totals[field.label] = 0;
  }
  for (let item of items.value) {
    let theArray = [];
    for (let field of props.options.fields) {
      if (field['value'](item) === null) {
        theArray.push('');
      } else {
        theArray.push(field['value'](item)) || '';
      }

      if (field['value'](item) === null || isNaN(field['value'](item))) {
        // if (isNaN(field['value'](item))) {
        // console.log('isnull:', field['value'](item));
        totals[field.label] = '';
      } else {
        // console.log('is not null:', field['value'](item));
        totals[field.label] = totals[field.label] + parseFloat(field['value'](item));
      }
    }
    tableData.push(theArray);
  }

  // if (props.options.totalRow.enabled) {
  if (typeof props.options.totalRow != 'undefined' && props.options.totalRow.enabled) {
    let theArray = [];
    for (let field of props.options.fields) {
      if (field.label.toLowerCase() === props.options.totalRow.totalField) {
        theArray.push('Total');
      } else if (totals[field.label] === '') {
        theArray.push('');
      } else {
        theArray.push(parseFloat(totals[field.label]).toFixed(2));
      }
    }
    tableData.push(theArray);
  }
  // console.log('fields:', fields, 'tableData:', tableData);
  // var doc = new jsPDF();
  var doc = new jsPDF('p', 'pt');
  doc.setFontSize(12);
  let top = 20;
  if(props.options.export.introLines) {
    for (let introLine of props.options.export.introLines) {
      doc.text(10, top, evaluateSlot(introLine));
      top = top + 12;
    }
  }
  doc.autoTable(fields, tableData, {
    head: [ fields ],
    body: tableData,
    startY: 100,
    tableWidth: 'wrap',
  });

  let filename;
  let fileStart = evaluateSlot(props.options.export.file);
  if (fileStart) {
    filename = evaluateSlot(props.options.export.file) + '.pdf';
  } else {
    filename = 'export.pdf';
  }
  doc.save(filename);
};

const exportTableToCSV = () => {
  // console.log('exportTableToCSV is running');
  const tableData = [];

  // let fields = [];
  let fields = fields.value;

  if (typeof props.options.expandedData != 'undefined') {
    let expandedData = props.options.expandedData();
    fields = fields.concat(expandedData);
    if (typeof props.options.tableSort != 'undefined') {
      fields  = props.options.tableSort(fields);
    }
  }

  // console.log('exportTableToCSV, fields:', fields);

  let totals = {};

  // for (let field of props.options.fields) {
  //   fields.push(field.label);
  //   totals[field.label] = 0;
  // }

  if (!items.value.length > 0) {
    return;
  }

  // console.log('items.value:', items.value);

  for (let item of items.value) {
    let object = {};
    // for (let field of props.options.fields) {
    for (let field of fields) {
      // console.log("field['value']($store.state, item)", field['value']($store.state, item));
      object[field.label] = typeof field['value'](item) === 'undefined' ? "" :
        field['value'](item) === null ? "" :
          field['value'](item).toString().replace('#', 'No.');
      if (isNaN(field['value'](item))) {
        // console.log('its NaN!');
        totals[field.label] = null;
      } else {
        if (!totals[field.label]) {
          totals[field.label] = parseFloat(field['value'](item));
        } else {
          // console.log('its not NaN:', field['value']($store.state, item));
          totals[field.label] = totals[field.label] + parseFloat(field['value'](item));
        }
      }
    }
    tableData.push(object);
  }

  // console.log('tableData:', tableData, 'props.options.totalRow:', props.options.totalRow, 'totals:', totals);

  if (typeof props.options.totalRow != 'undefined' && props.options.totalRow.enabled) {
    let object = {};
    for (let field of props.options.fields) {
      if (field.label.toLowerCase() === props.options.totalRow.totalField) {
        object[field.label] = 'Total';
      } else {
        object[field.label] = totals[field.label];
      }
    }
    tableData.push(object);
  }
  const opts = { fields };

  // console.log('in exportTableToCSV, tableData:', tableData);

  try {
    var result, ctr, keys, columnDelimiter, lineDelimiter, data;

    data = tableData || null;
    if (data == null || !data.length) {
      return null;
    }

    columnDelimiter = ',';
    lineDelimiter = '\n';
    // columnDelimiter = args.columnDelimiter || ',';
    // lineDelimiter = args.lineDelimiter || '\n';

    // keys = Object.keys(data[0]);
    keys = fields.map(a => a.value);
    // let state = store.state;

    result = '';

    if (props.options.export.introLines) {
      for (let introLine of props.options.export.introLines) {
        result += evaluateSlot(introLine);
        result += lineDelimiter;
      }
    }

    result += fields.map(field => field.label).join(columnDelimiter);
    result += lineDelimiter;

    data = data.map(item => Object.values(item).map(value => '"' + value + '"'));

    result += data.map(item => item).join(lineDelimiter);

    // console.log('in exportTableToCSV, fields:', fields, 'result:', result, 'data:', data);

    // result += lineDelimiter;
    // result += keys.join(columnDelimiter);
    // result += lineDelimiter;
    //
    // data.forEach(function(item) {
    //   ctr = 0;
    //   keys.forEach(function(key) {
    //     if (ctr > 0) {
    //       result += columnDelimiter;
    //     }
    //
    //     result += item[key] || '';
    //     ctr++;
    //   });
    //   result += lineDelimiter;
    // });

    let csv = result;

    data = null;
    let filename;
    let link;

    // filename = 'export.csv';
    let fileStart;
    if (props.options.export) {
      fileStart = evaluateSlot(props.options.export.file);
    }
    if (fileStart) {
      filename = evaluateSlot(props.options.export.file) + '.csv';
    } else {
      filename = 'export.csv';
    }

    let csv_notIE;
    if (!csv.match(/^data:text\/csv/i)) {
      csv_notIE = 'data:text/csv;charset=utf-8,' + csv;
    }
    data = encodeURI(csv_notIE);

    var isOpera = (!!window.opr && !!window.opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isFirefox = typeof InstallTrigger !== 'undefined';
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
      return p.toString() === "[object SafariRemoteNotification]";
    })(!window['safari'] || (typeof window['safari'] !== 'undefined' && window['safari'].pushNotification));
    var isIE = /*@cc_on!@*/false || !!document.documentMode;
    var isEdge = !isIE && !!window.StyleMedia;
    var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
    var isBlink = (isChrome || isOpera) && !!window.CSS;

    if (isIE) {
      var oWin = window.open();
      oWin.document.write('sep=,\r\n' + csv);
      oWin.document.close();
      oWin.document.execCommand('SaveAs', true, filename);
      oWin.close();
    } else {
      link = document.createElement('a');
      link.setAttribute('href', data);
      link.setAttribute('download', filename);
      link.click();
    }
  } catch (err) {
    console.error(err);
  }
};

const showMoreRecords = () => {
  // if there is only 1 page to return (from AIS);
  if (!pageCount.value) {
    compareAndSetHighestRowRetrieved();
    // if there are multiple pages to return (from AIS) and there are not enough items in the table state (itemsFiltered) to cover the increment;
  } else if (itemsAfterFilters.value.length < highestRowRetrieved.value + props.options.defaultIncrement) {
    // if there is another page to return (from AIS)
    if (pageCount.value > highestPageRetrieved.value) {
      getMoreRecords();
      compareAndSetHighestRowRetrieved();
      // if there are no more pages to return (from AIS)
    } else {
      highestRowRetrieved.value = count.value;
    }
    // if there are multiple pages to return (from AIS) but there are already enough items in the table state (itemsFiltered) to cover the increment;
  } else {
    if (!props.options.showAllRowsOnFirstClick) {
      highestRowRetrieved.value = highestRowRetrieved.value + props.options.defaultIncrement;
    } else {
      highestRowRetrieved.value = count.value;
    }
  }
};

const compareAndSetHighestRowRetrieved = () => {
  if (!props.options.showAllRowsOnFirstClick) {
    if (count.value < highestRowRetrieved.value + props.options.defaultIncrement) {
      highestRowRetrieved.value = count.value;
    } else {
      highestRowRetrieved.value = highestRowRetrieved.value + props.options.defaultIncrement;
    }
  } else {
    highestRowRetrieved.value = count.value;
  }
};

const getMoreRecords = () => {
  console.log('HorizontalTable.vue getMoreRecords is running');
  const dataSource = props.options.id;
  const highestPageRetrieved = highestPageRetrieved.value;
  emit('get-more-records', dataSource, highestPageRetrieved);
};

const slugifyFilterValue = (filterValue) => {
  const { direction, value, unit } = filterValue;
  return [ direction, value, unit ].join('-');
};

const deslugifyFilterValue = (slug) => {
  const parts = slug.split('-');
  const [ direction, value, unit ] = parts;
  return { value, unit, direction };
};

const handleSortValueChange = (e) => {
  console.log('handleSortValueChange running e:', e, 'e.target.value:', e.target.value);
  const value = e.target.value;

  let tableGroupId = props.item.tableGroupId;
  let activeTableId;//, activeFilterValues;
  // let theSelect = document.getElementById('time-select');
  // if ($store.state.horizontalTableGroups.length && tableGroupId != 'undefined') {
  //   activeTableId = $store.state.horizontalTableGroups[tableGroupId].activeTableId;
  //   // activeFilterValues = $store.state.horizontalTableGroups[tableGroupId].activeFilterValues;
  // }

  // if ($store.state.horizontalTableGroups.length) {
  //   $store.commit('setHorizontalTableGroupActiveSort', {
  //     tableGroupId: item.tableGroupId,
  //     activeSortValues: value,
  //   });
  // } //else if ($store.state.horizontalTables) {
    // $store.commit('setHorizontalTableGroupActiveSort', {
    //   tableGroupId: item.tableGroupId,
    //   activeSortValues: value,
    // });
  // }

  sortField.value = value;
};

const handleFilterValueChange = (e) => {
  // console.log('handle filter value change', e);

  const target = e.target;
  const slug = target.value;

  // deslugify filter value
  const valueObj = deslugifyFilterValue(slug);

  const parent = target.parentElement;
  const parentId = parent.id;

  // patch and replace filter selections
  const prevFilterSelections = filterSelections.value;
  const nextFilterSelections = Object.assign({}, prevFilterSelections);
  nextFilterSelections[parentId] = valueObj;
  filterSelections.value = nextFilterSelections;
};

const values = (item) => {
  const fields = props.options.fields;
  const sourceFields = fields.map(field => field.sourceField);
  return sourceFields.map(sourceField => item[sourceField]);
};

const handleFilterFormKeyup = (e) => {
  const input = e.target.value;
  searchText.value = input;
};

const handleFilterFormX = (e) => {
  e.target[0].value = '';
  searchText.value = "";
};

const filterItems = (items, filters, filterSelections) => {
  // console.log('typeof items:', typeof items);
  // console.log('FILTER ITEMS is running, items:', items, 'filters:', filters, 'filterSelections:', filterSelections);
  let itemsFiltered = items.slice();

  if (filters) {
    // console.log('in filterItems, filters:', filters, 'filters.length', filters.length, 'filters.entries():', filters.entries(), 'filters.keys():', filters.keys());
    // for (let [index, filter] of filters.entries()) {
    for (let index=0; index < filters.length; index++) {
      const key = 'filter-' + index;
      // const key = `filter-${index}`;
      const data = filterSelections[key];
      // console.log('index:', index, 'key:', key, 'data:', data, 'filters:', filters[index]);
      const { type, getValue } = filters[index];
      const { unit, value } = data;
      const direction = data.direction || 'subtract';

      // console.log('type:', type);

      // TODO put these in separate methods
      let min, max;
      let min2, max2;
      let subFn, addFn;

      switch(type) {
      case 'data':
        // console.log('DATA FILTER');
        // itemsFiltered = itemsFiltered.filter(item => {
        //   const itemValue = getValue(item);
        //   console.log('horiz table itemValue:', itemValue);
        //   return itemValue;
        // });
        break;
      case 'time':
        // console.log('TIME FILTER direction', direction, 'value:', value, 'unit:', unit);
        // let min, max;
        // let min2, max2;
        // let subFn, addFn;

        switch (unit) {
        case 'hours':
          subFn = subHours;
          addFn = addHours;
          break;
        case 'days':
          subFn = subDays;
          addFn = addDays;
          break;
        case 'weeks':
          subFn = subWeeks;
          addFn = addWeeks;
          break;
        case 'months':
          subFn = subMonths;
          addFn = addMonths;
          break;
        case 'years':
          subFn = subYears;
          addFn = addYears;
          break;
        }


        if (direction === 'subtract') {
          max = new Date();
          min = subFn(max, value);
          // console.log('max:', max, 'min', min);
        } else if (direction === 'add') {
          min = new Date();
          max = addFn(min, value);
        } else if (direction === 'both') {
          continue;
          // let date = new Date();
          // max = 
        } else {
          throw `Invalid time direction: ${direction}`;
        }

        if (direction === 'both') {
          return true;
        } else {
          // console.log('in case time, itemsFiltered:', itemsFiltered);
          itemsFiltered = itemsFiltered.filter(item => {
            const itemValue = getValue(item);
            let isBetween;
            if (typeof itemValue === 'string') {
              isBetween = isWithinInterval(parseISO(itemValue), { start: min, end: max });
            } else {
              isBetween = isWithinInterval(itemValue, { start: min, end: max });
            }
            // console.log('itemValue:', itemValue, 'min:', min, 'max:', max, 'isBetween:', isBetween);
            return isBetween;
          });
        }
        // console.log('ITEMS FILTERED BY TIME FILTER', itemsFiltered);
        break;

      default:
        throw `Unhandled filter type: ${type}`;
        // break;
      }
    }
  }
  return itemsFiltered;
};

const sortItems = (items, sortOpts) => {
  // console.log('sortItems, sortOpts:', sortOpts);
  // TODO finish this
  // if (Object.keys(filterData.value).length) {
  //   console.log('there is filterData', filterData.value);
  //   return itemsFiltered.value;
  // } else {
  //   console.log('there is no filterData');
  //   return items.value;
  // }

  // const items = itemsFiltered.value;
  // const sortOpts = props.options.sort;
  // console.log(sortOpts)

  // if there's no no sort config, just return the items.
  if (!sortOpts) {
    // console.log('noSortOpts');
    return items;
  }

  // const getValueFn = sortOpts.getValue;
  // const order = sortOpts.order;

  // get sort fn or use this basic one
  const sortFn = sortOpts.compare || defaultSortFn;
  // console.log('sortFn', sortFn);
  // console.log('sortFn', sortFn)
  return items.sort(sortFn);
};

const defaultSortFn = (a, b) => {
  // console.log('defaultSortFn is running, a:', a, 'b:', b);
  const sortOpts = props.options.sort;
  const getValueFn = sortOpts.getValue;
  const sortField = sortField.value;
  let order;
  if (typeof sortOpts.order === 'function') {
    const orderFn = sortOpts.order;
    order = orderFn(sortField.value);
  } else {
    order = sortOpts.order;
  }
  // console.log('sortField', sortField, 'order', order);

  const valA = getValueFn(a, sortField.value);
  const valB = getValueFn(b, sortField.value);
  let result;

  if (valA === null) {
    if (order === 'desc') {
      result = -1;
    } else {
      result = 1;
    }
  } else if (valB === null) {
    if (order === 'desc') {
      result = 1;
    } else {
      result = -1;
    }
  } else if (valA < valB) {
    result = -1;
  } else if (valB < valA) {
    result = 1;
  } else {
    result = 0;
  }

  // reverse if we have an order and the target order is desc
  if (order) {
    if (order === 'desc') {
      result = result * -1;
    } else if (order !== 'asc') {
      throw `Unknown sort order: ${order}`;
    }
  }

  // console.log('compare', valA, 'to', valB, ', result:', result);

  return result;
};

// this updates the global state that stores filtered table rows
// const updateTableFilteredData = () => {
//   // console.log('update table filtered data is running, options:', props.options);
//   // get table id
//   const { tableId } = props.options;
//   // update global state
//   $store.commit('setHorizontalTableFilteredData', {
//     tableId,
//     data: itemsAfterFilters.value,
//   });
// };

const isEmpty = (obj) => {
  for(var key in obj) {
    if(obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
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
  <div class="pvc-horizontal-table">
    <!-- <button v-if="shouldShowButton"
    >
      Text
    </button> -->
    <div v-if="shouldShowTable">
      <!-- controls -->
      <div
        v-if="shouldShowFilters !== false"
        class="pvc-horizontal-table-controls"
      >
        <div
          v-if="!!options.filters"
          class="vertically-centered"
        >
          <!-- TODO the ids for filter spans should incorporate some sort of topic comp
          to make them globally unique -->
          <div
            v-for="(filter, index) in filters"
            :id="'filter-' + index"
            :key="index"
            class="inline-block"
          >
            <div class="vertically-centered pvc-select-text">
              {{ filter.label }}
            </div>
            <select
              :id="'time-select-'+options.tableId"
              class="pvc-select"
              @change="handleFilterValueChange"
            >
              <optgroup>
                <option
                  v-for="(filterValue, filterIndex) in filter.values"
                  :key="filterIndex"
                  :value="slugifyFilterValue(filterValue)"
                  class="pvc-select-option"
                >
                  {{ filterValue.label }}
                </option>
              </optgroup>
            </select>
          </div>
        </div>

        <!-- <div v-if="!!$props.options.sort && !!$props.options.sort.select" -->
        <div
          v-if="!!options.sort && !!options.sort.select"
          class="vertically-centered"
        >
          <div class="vertically-centered pvc-select-text">
            Sort by
          </div>
          <select
            :id="'time-sort-'+options.tableId"
            class="pvc-select"
            @change="handleSortValueChange"
          >
            <optgroup>
              <option
                v-for="sortField in sortFields"
                :key="sortField"
                :value="sortField"
                class="pvc-select-option"
              >
                {{ sortField }}
              </option>
            </optgroup>
          </select>
        </div>

        <div
          v-if="filterByTextFields"
          class="vertically-centered"
        >
          <div class="pvc-select-text inline-block">
            {{ options.filterByText.label }}
          </div>
          <form
            class="inline-block filter-by-text-form"
            @submit.prevent="handleFilterFormX"
          >
            <input
              id="theInput"
              :class="inputClass"
              @keyup="handleFilterFormKeyup"
            >
            <button
              v-if="searchText != ''"
              class="pvc-search-control-button"
            >
              <font-awesome-icon
                icon="times"
                class="fa-lg"
              />
            </button>
          </form>
        </div>
      </div> <!-- end of pvc-horizontal-table-controls block -->

      <div :class="{ 'pvc-horizontal-table-body': true, 'no-padding': !shouldShowFilters }">
        <!-- this is the start of an added zone -->
        <!-- <a
          v-if="$store.state.fullScreenTopicsEnabled !== true
            && $store.state.fullScreenMapEnabled !== true
            && options.downloadButton === true"
          class="button pvc-download-data-button"
          @click="exportTableToCSV"
        >
          Download Data
        </a>

        <a
          v-if="shouldShowExportPDF"
          :class="'pdf ' + buttonPositionClass"
          @click="exportTableToPDF"
        >
          {{ options.export.formatButtons.pdf }}
        </a> -->

        <button-comp-light
          v-if="shouldShowExportCSV"
          :class="'csv ' + buttonPositionClass"
          :slots="{buttonAction: exportTableToCSV}"
        >
          <font-awesome-icon
            v-if="options.export.formatButtons.csv.icon"
            :icon="options.export.formatButtons.csv.icon"
            class="button-icon"
          />
          {{ options.export.formatButtons.csv.text }}
        </button-comp-light>

        <button-comp-light
          v-if="shouldShowExportPDF"
          :class="'pdf ' + buttonPositionClass"
          :slots="{buttonAction: exportTableToPDF}"
        >
          <font-awesome-icon
            v-if="options.export.formatButtons.pdf.icon"
            :icon="options.export.formatButtons.pdf.icon"
            class="button-icon"
          />
          {{ options.export.formatButtons.pdf.text }}
        </button-comp-light>

        <button-comp-light
          v-if="shouldShowExportPDFLight"
          :class="'pdf ' + buttonPositionClass"
          :slots="{buttonAction: exportTableToPDF}"
        >
          <font-awesome-icon
            v-if="options.export.formatButtons['pdf-light'].icon"
            :icon="options.export.formatButtons['pdf-light'].icon"
            class="button-icon"
          />
          {{ options.export.formatButtons['pdf-light'].text }}
        </button-comp-light>

        <button-comp-light
          v-if="shouldShowExportMailing"
          :class="'mailing ' + buttonPositionClass"
          :slots="{buttonAction: exportTableToMailing}"
        >
          <font-awesome-icon
            v-if="options.export.formatButtons.mailing.icon"
            :icon="options.export.formatButtons.mailing.icon"
            class="button-icon"
          />
          {{ options.export.formatButtons.mailing.text }}
        </button-comp-light>
        <!-- this is the end of an added zone -->

        <div v-if="slots.title">
          <h4
            v-if="i18nEnabled"
            style="display:inline-block"
            v-html="$t(evaluateSlot(slots.title))"
          />
          <h5
            v-if="i18nEnabled"
            style="display:inline-block; color: gray"
            v-html="$t(evaluateSlot(slots.subtitle))"
          />
          <h4
            v-if="!i18nEnabled"
            style="display:inline-block"
          >
            {{ evaluateSlot(slots.title) }} {{ countText }}
          </h4>
          <h5
            v-if="!i18nEnabled"
            style="display:inline-block; color: gray"
          >
            {{ evaluateSlot(slots.subtitle) }}
          </h5>
          <!-- <a
            v-if="shouldShowExportCSV"
            class="button pvc-export-data-button"
            @click="exportTableToCSV"
          >
            {{ options.export.formatButtons.csv }}
          </a>
          <a
            v-if="shouldShowExportPDF"
            class="button pvc-export-data-button"
            @click="exportTableToPDF"
          >
            {{ options.export.formatButtons.pdf }}
          </a> -->
        </div>

        <table
          :id="options.id"
          role="grid"
          class="stack"
          :class="typeof options.customClass != 'undefined'
            && typeof options.customClass.table != 'undefined' ?
              options.customClass.table : ''"
        >
          <thead v-if="shouldShowHeaders !== false">
            <tr>
              <th
                v-if="i18nEnabled"
                v-for="field in fields"
                :key="field.label"
                :class="typeof options.customClass != 'undefined'
                  && typeof options.customClass.th != 'undefined' ?
                    specifySortType(field.label) : ''"
                :title="typeof options.customClass != 'undefined'
                  && typeof options.customClass.title != 'undefined' ?
                    options.customClass.title : ''"
                v-html="$t(evaluateSlot(field.label))"
              >
              </th>
              <th
                v-if="!i18nEnabled"
                v-for="field in fields"
                :key="field.label"
                :class="typeof options.customClass != 'undefined'
                  && typeof options.customClass.th != 'undefined' ?
                    specifySortType(field.label) : ''"
                :title="typeof options.customClass != 'undefined'
                  && typeof options.customClass.title != 'undefined' ?
                    options.customClass.title : ''"
              >
                {{ evaluateSlot(field.label) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <horizontal-table-row
              v-for="item in itemsLimited"
              :key="item._featureId"
              :item="item"
              :fields="fields"
              :has-overlay="hasOverlay"
              :table-id="options.tableId"
              :options="options"
            />
            <horizontal-table-row
              v-if="totalRowEnabled"
              :should-be-bold="true"
              :item="itemsLimitedSummed"
              :fields="fields"
              :table-id="options.tableId"
              :total-row-field="totalRowField"
            />
          </tbody>
        </table>

        <!-- external link (aka "see more")-->
        <external-link
          v-if="options.externalLink && shouldShowExternalLink"
          :options="options.externalLink"
          :count="count"
          :limit="limit"
          :type="'horizontal-table'"
        />
        <!-- <div class="external-link"
             v-if="options.externalLink && shouldShowExternalLink"
        >
          <a :href="externalLinkHref"
             target="_blank"
          >
            {{ externalLinkText }}
            <font-awesome-icon icon="external-link-alt" aria-hidden="true" />
          </a>
        </div> -->
      </div>

      <a
        v-if="shouldShowRetrieveButton"
        class="button center-button"
        @click="showMoreRecords"
      >
        Retrieve {{ nextIncrement }} More {{ nextIncrement === 1? 'Record' : 'Records' }}
        <span
          v-show="secondaryStatus === 'waiting'"
          class="loading"
        >
          <font-awesome-icon
            icon="spinner"
            class="fa-lg"
          />
        </span>
      </a>
    </div>
  </div>
</template>

<style scoped>
@import 'phila-standards/dist/css/phila-app.min.css';

.pvc-export-data-button {
  position: fixed;
  float: right;
}

.csv {
  right: 5px;
}

.mailing {
  right: 165px;
}

.inline-block {
  display: inline-block;
}

.vertically-centered {
  display: inline-block;
  vertical-align: middle;
}

.pvc-horizontal-table {
  margin-bottom: 10px !important;
}

.pvc-horizontal-table-controls {
  text-align: center;
  vertical-align: middle;
  margin-bottom: 10px;
}

/* dropdown filters */
.pvc-select-text {
  font-size: 16px;
  padding-right: 5px;
  padding-left: 5px;
}

.pvc-select {
  width: auto;
  height: 40px;
  vertical-align: middle;
  /*padding-right: 20px;*/
}

.pvc-select-option {
  display: inline-block;
  padding-right: 100px;
  margin-right: 100px;
}

/* input filters using text */
.pvc-search-control-input {
  height: 40px !important;
  line-height: 48px;
  padding: 8px;
  font-size: 16px;
  width: 300px;
  /*margin-left: 10px;*/
}

/*REVIEW this repeats a lot of .pvc-search-control-input. can it be refactored?*/
.pvc-search-control-input-full {
  height: 40px !important;
  line-height: 48px;
  padding: 8px;
  font-size: 16px;
  width: 260px;
}

.pvc-search-control-button {
  width: 40px;
  background: #ccc;
  line-height: 40px;
  float: right;
}

.pvc-export-data-button {
  vertical-align: baseline;
  display: inline-block;
  margin-left: 10px;
  margin-right: 5px;
  margin-top: 5px;
  padding: 4px;
}

.pvc-export-data-button-right {
  float: right;
  vertical-align: baseline;
  display: inline-block;
  margin-left: 5px;
  margin-right: 5px;
  margin-bottom: 5px;
  padding: 4px;
}

.pvc-download-data-button, .pvc-export-data-button {
  vertical-align: baseline;
  display: inline-block;
}

/* .pvc-export-data-button {
  vertical-align: baseline;
  display: inline-block;
  margin-left: 10px;
  margin-right: 5px;
  margin-top: 5px;
  padding: 4px;
} */

.group:after {
  content: "";
  display: table;
  clear: both;
}

.pvc-horizontal-table-body {
  padding-top: 1rem;
  padding-bottom: 0.35rem;
}

.no-padding {
  padding-top: 0;
  padding-bottom: 0;
}

.center-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading {
  float: right;
}

.filter-by-text-form {
  border: 2px solid #0f4d90;
}

.position-relative {
  position: relative !important;
}

table {
  /* table-layout: fixed; */
  margin: 0;
}

.external-link {
  padding-top: 5px;
}

</style>
