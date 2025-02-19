<script setup>

import { computed, watch, ref } from 'vue';

import { useMainStore } from '@/stores/MainStore.js';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();
import { useDatafetchStore } from '@/stores/DatafetchStore.js';
const DatafetchStore = useDatafetchStore();
import { useOpaStore } from '@/stores/OpaStore.js';
const OpaStore = useOpaStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js';
const GeocodeStore = useGeocodeStore();

import { format, parseISO } from 'date-fns';
import helpers from '../util/helpers';
import transforms from '../general/transforms';
const titleCase = transforms.titleCase.transform;

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
});

import HorizontalTable from './HorizontalTable.vue';
// import PropertyCard from './PropertyCard.vue';

// components
// Callout: () => import(/* webpackChunkName: "pvc_Callout" */'@phila/vue-comps/src/components/Callout.vue'),
// Badge: () => import(/* webpackChunkName: "pvc_Badge" */'@phila/vue-comps/src/components/Badge.vue'),
// BadgeCustom: () => import(/* webpackChunkName: "pvc_BadgeCustom" */'@phila/vue-comps/src/components/BadgeCustom.vue'),
// CollectionSummary: () => import(/* webpackChunkName: "pvc_CollectionSummary" */'@phila/vue-comps/src/components/CollectionSummary.vue'),
// ExternalLink: () => import(/* webpackChunkName: "pvc_ExternalLink" */'@phila/vue-comps/src/components/ExternalLink.vue'),
// FullScreenDataToggleTab: () => import(/* webpackChunkName: "pvc_FullScreenDataToggleTab" */'@phila/vue-comps/src/components/FullScreenDataToggleTab.vue'),
// HorizontalTable: () => import(/* webpackChunkName: "pvc_HorizontalTable" */'@phila/vue-comps/src/components/HorizontalTable.vue'),
// VerticalTable: () => import(/* webpackChunkName: "pvc_VerticalTable" */'@phila/vue-comps/src/components/VerticalTable.vue'),
  
let showTable = ref(false);
// 'loadingData': false,
let condoExpanded = ref(false);
let lastAddressQuery = ref(null);
 
// computed
// atlasUrl() {
//   return 'https://atlas.phila.gov/' + encodeURIComponent(lastAddressQuery) + '/property';
// },

const loadingData = computed(() => {
  return MainStore.loadingData;
});

const lastSearchMethod = computed(() => {
  return MainStore.lastSearchMethod;
});

const opa = computed(() => {
  return OpaStore.opa_assessment;
});

const opaStatus = computed(() => {
  // return MainStore.sources.opa_assessment.status;
  if (opa.value && opa.value.status) {
    return opa.value.status;
  }
  return null;
});

const geocode = computed(() => {
  return GeocodeStore.aisData;
});

const geocodeInput = computed(() => {
  return GeocodeStore.aisData.query;
});

const geocodeStatus = computed(() => {
  return GeocodeStore.geocodeStatus;
});

const geocodeItems = computed(() => {
  let data = [];
  // if (!condoExpanded.value && geocode.value.features[0] && DatafetchStore.condoUnits.units && MainStore.parcels.pwd && MainStore.parcels.pwd[0].properties && MainStore.lastSearchMethod === 'geocode') {
  if (!condoExpanded.value && geocode.value.features[0] && DatafetchStore.condoUnits.units && MainStore.parcels.pwd && MainStore.parcels.pwd[0].properties) {
  // if (geocode.value.features[0] && DatafetchStore.condoUnits.units && MainStore.parcels.pwd && MainStore.parcels.pwd[0].properties) {
    const parentCondo = geocode.value.features[0];
    console.log('in geocodeItems, in if, parentCondo:', parentCondo);
    for (let i in parentCondo.properties) {
      parentCondo.properties[i] = "";
    }
    if (DatafetchStore.condoUnits.units[MainStore.parcels.pwd[0].properties.PARCELID]) {
      parentCondo.properties.opa_owners = [ "Condominium (" + DatafetchStore.condoUnits.units[MainStore.parcels.pwd[0].properties.PARCELID].length + " Units)" ];
    }
    parentCondo.properties.street_address = MainStore.parcels.pwd[0].properties.ADDRESS;
    parentCondo.properties.opa_address = MainStore.parcels.pwd[0].properties.ADDRESS;
    parentCondo.properties.pwd_parcel_id = MainStore.parcels.pwd[0].properties.PARCELID;
    parentCondo._featureId = MainStore.parcels.pwd[0].properties.PARCELID;
    // parentCondo.condo = true;
    data.push(parentCondo);
  } else {
    console.log('in geocodeItems, in else, geocode.value.features[0]:', geocode.value.features[0], 'geocode.value.related:', geocode.value.related);
    if (geocode.value.features[0]) {
      data.push(geocode.value.features[0]);
    }
    if (geocode.value.related) {
      for (let related of geocode.value.related) {
        data.push(related);
      }
    }
  }
  return data;
});

const geocodeOptions = computed(() => {
  const options = {
    id: 'ownerProperties',
    tableid: 'aaa',
    dataSources: [ 'opa_assessment' ],
    mapOverlay: {},
    clickEnabled: true,
    downloadButton: false,
    expandDataDownload: true,
    mailingFields: getMailingFields(),
    tableSort: tableSort(),
    expandedData: expandedData(),
    rowAction: rowClick,
    colSpan: {
      condition: 'condo',
      column: 'Market Value',
      span: 3,
    },
    export: {
      formatButtons: {
        csv: {text: ' Download CSV', icon: 'download'},
        mailing: {text: "Mailing Labels", icon: 'envelope'}
      },
    },
    customClass: {
      table: 'sortable',
      title: 'Sort results',
      th: function(field) {
        let classType = field === 'Price of Last Sale' ? 'sorttable_numeric pointer':
          field === 'Market Value' ? 'sorttable_numeric pointer':
            field === 'Date of Last Sale' ? 'sorttable_numeric pointer': 'pointer';
        return classType;

      },
      tr: 'pointer',
    },
    fields: [
      {
        label: 'Street Address',
        shouldBeBold: true,
        value: function(item) {
          console.log('in Street Address, item:', item);
          let address;
          if(MainStore.lastSearchMethod === "buffer search") {
            address = titleCase(item.address_std);
          } else if (typeof item.properties.street_address != 'undefined') {
            address = titleCase(item.properties.street_address);
          } else if(item.properties.opa_address != "" && item.properties.opa_address != null) {
            address = titleCase(item.properties.opa_address);
          }
          return address;
        },
        customStyle: { float: 'left', 'padding-right': '5px' },
        customClass: "address-field faux-link",
        mobileIcon: "info-circle",
        hideMobileIcon: (state, item) => typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined' ? true : false ,
      },
      {
        label: 'Market Value',
        value: function(item){
          if(OpaStore.opa_assessment.targets[item.properties.opa_account_num]){
            if(typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num].data != 'undefined') {
              return formatter.format(OpaStore.opa_assessment.targets[item.properties.opa_account_num].market_value);
            }
          } else {
            return '';
          }
        },
        components: [
          {
            type: 'button-comp',
            slots: {
              text: 'Click to add units to results.',
              buttonAction: addCondoRecords,
              buttonFinished() {
                // console.log("button finished running")
                showTable.value = true;
              },
            },
            options: {
              class: function (state, item) {
                // console.log('calculating button-comp class, item.properties.opa_account_num:', item.properties.opa_account_num, typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num]);
                // return OpaStore.opa_assessment.targets[item.properties.opa_account_num] ? "" : 'condo-button';
                if (typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined') {
                  return '';
                } else {
                  return 'condo-button';
                }
              },
              style: function (state, item) {
                // return OpaStore.opa_assessment.targets[item.properties.opa_account_num] ? { display: 'none' } : "";
                if (typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined') {
                  return { display: 'none' };
                } else {
                  return '';
                }
              },
            },
          },
        ],
      },
      {
        label: 'Date of Last Sale',
        value: function(item) {
          if (item.properties.opa_account_num != ""){
            if (typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined') {
              // return format(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date, 'MM/DD/YYYY');
              if (OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date != null) {
              return format(parseISO(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date), 'MM/dd/yyyy');
              } else {
                return "Not Applicable"
              }
            }
          } else {
            return "Not Applicable"
          }
        },
        customKey: function(item) {
          if (item.properties.opa_account_num != "") {
            if (typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined' && OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date != null) {
              // console.log(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date);
              return format(parseISO(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date), 'yyyyMMdd');
            }
            return;

          }
          return 0;

        },
      },
      {
        label: 'Price of Last Sale',
        value: function(item) {
          if(item.properties.opa_account_num != ""){
            if(typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined'){
              if(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_price != null) {
                return formatter.format(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_price);
              } else {
                return "Not Applicable"
              }
            }
          } else {
            return "Not Applicable";
          }
        },
      },
      {
        label: 'Owner',
        value: function(item){
          if (item.properties.opa_owners != '' && typeof item.properties.opa_owners != 'undefined') {
            return item.properties.opa_owners.join(', ');
          }
          return item.properties.usps_bldgfirm;

        },
      },
    ],
  };
  return options;
});

const ownerOptions = computed(() => {
  // const rowClick = rowClick();
  const options = {
    id: 'ownerProperties',
    tableid: 'bbb',
    dataSources: [ 'opa_assessment' ],
    mapOverlay: {},
    clickEnabled: true,
    downloadButton: false,
    expandDataDownload: true,
    mailingFields: getMailingFields(),
    tableSort: tableSort(),
    expandedData: expandedData(),
    rowAction: rowClick,
    colSpan: {
      condition: 'condo',
      column: 'Market Value',
      span: 3,
    },
    export: {
      formatButtons: {
        csv: {text: ' Download CSV', icon: 'download'},
        mailing: {text: "Mailing Labels", icon: 'envelope'}
      },
    },
    customClass: {
      table: 'sortable',
      title: 'Sort results',
      th: function(field) {
        let classType = field === 'Price of Last Sale' ? 'sorttable_numeric pointer':
          field === 'Market Value' ? 'sorttable_numeric pointer':
            field === 'Date of Last Sale' ? 'sorttable_numeric pointer': 'pointer';
        return classType;

      },
      tr: 'pointer',
    },
    fields: [
      {
        label: 'Street Address',
        customClass: "address-field faux-link",
        value: function(item) {
          // console.log(item.properties)
          return titleCase(item.properties.opa_address);
        },
        hideMobileIcon: true,
        customStyle: { float: 'left', 'padding-right': '5px' },
        mobileIcon: "info-circle",
      },
      {
        label: 'Market Value',
        value: function(item){
          if(OpaStore.opa_assessment.targets[item.properties.opa_account_num]){
            if(typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num].data != 'undefined') {
                  return formatter.format(OpaStore.opa_assessment.targets[item.properties.opa_account_num.toString()].data.market_value);
            }
          } else {
            return '';
          }
        },
        components: [
          {
            type: 'button-comp',
            slots: {
              text: 'Click to add units to results.',
              buttonAction: addCondoRecords,
              buttonFinished() {
                // console.log("button finished running")
                showTable.value = true;
              },
            },
            options: {
              class: function (state, item) {
                // console.log('calculating button-comp class, item.properties.opa_account_num:', item.properties.opa_account_num, typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num]);
                // return OpaStore.opa_assessment.targets[item.properties.opa_account_num] ? "" : 'condo-button';
                if (typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined') {
                  return '';
                } else {
                  return 'condo-button';
                }
              },
              style: function (state, item) {
                // return OpaStore.opa_assessment.targets[item.properties.opa_account_num] ? { display: 'none' } : "";
                if (typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined') {
                  return { display: 'none' };
                } else {
                  return '';
                }
              },
            },
          },
        ],
      },

      {
        label: 'Date of Last Sale',
        value: function(item) {
          if (item.properties.opa_account_num != ""){
            if (typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined') {
              // console.log(item.properties.opa_account_num, OpaStore.opa_assessment.targets[item.properties.opa_account_num] )
              // return format(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date, 'MM/DD/YYYY');
              return format(parseISO(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date.toString()), 'MM/dd/yyyy');
            }
          } else {
            return "Not Applicable";
          }
        },
        customKey: function(item) {
          if (item.properties.opa_account_num != "") {
            if (typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined') {
              // console.log(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date);
              return format(parseISO(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date.toString()), 'yyyyMMdd');
            }
            return;

          }
          return 0;

        },
      },

      // {
      //   label: 'Date of Last Sale',
      //   value: function(item) {
      //     // return format(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date.toString(), 'MM/DD/YYYY');
      //     return format(parseISO(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date.toString()), 'MM/dd/yyyy');
      //   },
      //   customKey: function(item) {
      //     // return format(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date.toString(), 'MM/DD/YYYY');
      //     return format(parseISO(OpaStore.opa_assessment.targets[item.properties.opa_account_num].sale_date.toString()), 'yyyyMMdd');
      //   },
      // },


      {
        label: 'Price of Last Sale',
        value: function(item) {
          if(item.properties.opa_account_num != ""){
            if(typeof OpaStore.opa_assessment.targets[item.properties.opa_account_num] != 'undefined'){
                return formatter.format(OpaStore.opa_assessment.targets[item.properties.opa_account_num.toString()].data.sale_price);
            }
          } else {
            return "Not Applicable";
          }
        },
      },

      // {
      //   label: 'Price of Last Sale',
      //   value: function(item) {
      //     return formatter.format(OpaStore.opa_assessment.targets[item.properties.opa_account_num.toString()].data.sale_price);
      //   },
      // },
      {
        label: 'Owner',
        value: function(item){
          if (item.properties.opa_owners != '') {
            return item.properties.opa_owners.lrength > 1 ? item.properties.opa_owners.join(', ') : item.properties.opa_owners;
          }
          return item.properties.usps_bldgfirm;
        },
        components: [
          {
            type: 'button-comp',
            slots: {
              buttonAction(state, item) {event.stopPropagation(), rowClick(state, item) },
              text: function(state){
                let buttonClass = state.lastSearchMethod === 'block search' ? '<i class="fas fa-location-arrow hide"></i>' : '<i class="fas fa-location-arrow"></i>'
                return buttonClass
              },
            },
            options: {
              stopClickedChange: true,
              class: "owner-locate-button",
            },
          },
        ],
      },
    ],
  };
  return options;
});

const shapeOptions = computed(() => {
  const options = {
    id: 'ownerProperties',
    tableid: 'ccc',
    // dataSources: ['opa_assessment'],
    mapOverlay: {},
    clickEnabled: true,
    downloadButton: false,
    expandDataDownload: true,
    mailingFields: getMailingFields(),
    tableSort: tableSort(),
    expandedData: expandedData(),
    colSpan: {
      condition: 'condo',
      column: 'Market Value',
      span: 3,
    },
    rowAction: rowClick,
    export: {
      formatButtons: {
        csv: {text: ' Download CSV', icon: 'download'},
        mailing: {text: "Mailing Labels", icon: 'envelope'}
      },
    },
    customClass: {
      table: 'sortable',
      title: 'Sort results',
      th: function(field) {
        let classType = field === 'Price of Last Sale' ? 'sorttable_numeric pointer':
          field === 'Market Value' ? 'sorttable_numeric pointer':
            field === 'Date of Last Sale' ? 'sorttable_numeric pointer': 'pointer';
        return classType;

      },
      tr: 'pointer',
    },
    fields: [
      {
        label: 'Street Address',
        customClass: "address-field faux-link",
        value: function(item) {
          if(item.unit != null && item.unit != "") {
            return titleCase(item.address_std);
          }
          return titleCase(item.location);

        },
        customStyle: { float: 'left', 'padding-right': '5px' },
        mobileIcon: "info-circle",
        hideMobileIcon: (state, item) => item.condo ? false : true ,
      },
      {
        label: 'Market Value',
        value: function(item){
          if(item.market_value != "") {
            return formatter.format(item.market_value);
          }
          return  '';

        },
        components: [
          {
            type: 'button-comp',
            slots: {
              text: 'Click to add units to results.',
              buttonAction: addCondoRecords,
            },
            options: {
              class: function (state, item) {
                return item.condo ? 'condo-button' : "";
              },
              style: function (state, item) {
                return item.condo ? "" : { display: 'none' };
              },
            },
          },
        ],
      },
      {
        label: 'Date of Last Sale',
        value: function(item) {
          if (item.sale_date != "" && item.sale_date != null) {
            // return format(item.sale_date, 'MM/DD/YYYY');
            return format(parseISO(item.sale_date), 'MM/dd/yyyy');
          }
          return "Not Applicable";

        },
        customKey: function(item) {
          if (item.sale_date != "" && item.sale_date != null) {
            // console.log(   format(parseISO(item.sale_date), 'yyyyMMdd')  );
            return format(parseISO(item.sale_date), 'yyyyMMdd');
          }
          return 0;

        },
      },
      {
        label: 'Price of Last Sale',
        value: function(item) {
          if (item.sale_price != "" && item.sale_price != null) {
            return formatter.format(item.sale_price);
          }
          return "Not Applicable";

        },
      },
      {
        label: 'Owner',
        value: function(item){
          if (item.owner_1 != "" && item.owner_1 != null) {
            let owners = item.owner_2 != null ?
              item.owner_1.trim() + ", " + item.owner_2.trim():
              item.owner_1.trim();

            return owners;
          }
          return "";

        },
      },
    ],
  };
  return options;
});

// watch

watch(
  () => geocodeInput,
  (nextGeocodeInput) => {
  console.log('DataPanel.vue watch geocodeInput, nextGeocodeInput:', nextGeocodeInput);
  if (nextGeocodeInput) {
    lastAddressQuery.value = nextGeocodeInput;
  }
});

watch(
  () => opaStatus,
  (nextOpaStatus) => {
  if (nextOpaStatus === 'success') {
    showTable.value = true;
    MainStore.setLoadingData(false);
  } else if (nextOpaStatus === 'waiting') {
    MainStore.setLoadingData(true);
  } else {
    MainStore.setLoadingData(false);
  }
});

watch(
  () => geocodeStatus,
  (nextGeocodeStatus) => {
  if (nextGeocodeStatus === 'waiting') {
    condoExpanded.value = false;
  }
});

// methods
const activeOpaId = (item) => {
  let opaId;
  if(item.condo) {
    opaId = "";
    } else {
      if (![ 'geocode', 'reverseGeocode', 'owner search', 'block search' ].includes(lastSearchMethod.value)) {
        opaId = item.parcel_number;
      } else {
        opaId = item.properties.opa_account_num;
      }
  }
  return opaId;
};

const opaPublicData = (item) => {
  return typeof MainStore.sources.opa_public.targets[activeOpaId(item)] === 'undefined' ? "" :
    MainStore.sources.opa_public.targets[activeOpaId(item)].data;
};

const addCondoRecords = () => {
  console.log('addCondoRecords is running');

  showTable.value = false;
  condoExpanded.value = true;
  let mapUnitIds = function(id) {
    // console.log('running mapUnitIds, id:', id, DatafetchStore.condoUnits.units[id]);
    let unitsToAdd = DatafetchStore.condoUnits.units[id];
    unitsToAdd.map(
      (item, index) => {
        typeof item.properties != 'undefined' ? item._featureId = item.properties.pwd_parcel_id + "-UNIT-" + index :
          item._featureId = item.pwd_parcel_id + "-UNIT-" + index;
      },
    );
    // console.log("Units to add: ", unitsToAdd)
    return unitsToAdd;
  };
  mapUnitIds = mapUnitIds.bind(this);
  // console.log('after mapUnitIds', item);
  let unitData;
  if (MainStore.lastSearchMethod === 'block search') {
      let result = DatafetchStore.blockSearch.data.filter(
      row => row._featureId === item._featureId,
    );
  // console.log("block button: ", item, "result: ", result);

  function arrayObjectIndexOf(myArray, searchTerm, property) {
      for(let i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) {
          return i;
        }
      }
      return -1;
  }

  let units = mapUnitIds(result[0].properties.pwd_parcel_id);
  // console.log("arrayObjectIndexOf: ", DatafetchStore.blockSearch.data, item._featureId );
  units.objIndex = arrayObjectIndexOf(DatafetchStore.blockSearch.data, item._featureId, "_featureId" );

  // console.log("mapped unit id's: ", units);
  DatafetchStore.setBlockSearchDataPush(units);
  // $controller.dataManager.resetData();
  // $controller.dataManager.fetchData();


  } else if (MainStore.lastSearchMethod === 'geocode') {
    // $controller.dataManager.resetData();
    condoExpanded.value = true;
    const input = MainStore.parcels.pwd ?
            MainStore.parcels.pwd[0].properties.ADDRESS :
            GeocodeStore.aisData.features[0].properties.opa_address;
    // $controller.dataManager.clients.condoSearch.fetch(input);
    unitData = mapUnitIds(item._featureId);
    // console.log('in addCondoRecords, lastSearchMethod = geocode');
    DatafetchStore.setGeocodeRelated(unitData);
    // $controller.dataManager.fetchData();
  } else if (MainStore.lastSearchMethod === 'reverseGeocode' ) {
  // if (MainStore.lastSearchMethod === 'reverseGeocode' || MainStore.lastSearchMethod === 'geocode') {
    // console.log("Not shape search, input: ", input)

    // $controller.dataManager.resetData();
    // $controller.dataManager.resetShape();
    const input = MainStore.parcels.pwd[0].properties.ADDRESS;
    // $controller.dataManager.clients.condoSearch.fetch(input);

    unitData = mapUnitIds(item._featureId);
    DatafetchStore.setGeocodeRelated(unitData);

    // $controller.dataManager.fetchData();
  } else {
    let result = DatafetchStore.shapeSearch.data.rows.filter(
      row => row._featureId === item._featureId,
    );

    function arrayObjectIndexOf(myArray, searchTerm, property) {
      for(let i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) {
          return i;
        }
      }
      return -1;
    }

    let units = mapUnitIds(result[0].pwd_parcel_id);
    units.objIndex = arrayObjectIndexOf(DatafetchStore.shapeSearch.data.rows, item._featureId, "_featureId" );

    DatafetchStore.setShapeSearchDataPush(units);
    // $controller.dataManager.resetData();
    // $controller.dataManager.fetchData();
  }
};

const tableSort = (fields) => {
  if (fields) {
    Array.prototype.move = function (from, to) {
      this.splice(to, 0, this.splice(from, 1)[0]);
    };
  
    // list needs to be in reverse order
    let tableReorder = [
      "Zoning Description",
      "Zoning Code",
      "Building Description",
      "Building Condition",
      "Land Area (SqFt)",
      "Improvement Area (SqFt)",
      "Homestead Exemption",
      "Price of Last Sale",
      "Date of Last Sale",
      "Market Value",
      "State",
      "City",
      "Zip Code",
      "Street Address",
      "Owner",
      "OPA Account Number",
    ];
    for ( let sortLabel of tableReorder) {
      fields.move(fields.map(e => e.label).indexOf(sortLabel), 0);
    }
  }

  return fields;
};

const rowClick = (state, item) => {
  console.log('rowClick is running, state:', state, 'item:', item);
  let parcel_number;
  if (item.parcel_number) {
    parcel_number = item.parcel_number;
  } else {
    parcel_number = item.properties.opa_account_num;
  }
  console.log('DataPanel.vue Row Click, item:', item, 'item.properties:', item.properties, 'parcel_number:', parcel_number);
  if (parcel_number) {
    // $controller.setRouteByOpaNumber(parcel_number);
  }
  let coords = [];
  if(typeof geocodeItems.value[0] != 'undefined') {
    Array.prototype.push.apply(coords, [ geocodeItems.value[0].geometry.coordinates[0], geocodeItems.value[0].geometry.coordinates[1] ]);
  // } else if (lastSearchMethod.value === "owner search") {
  //   Array.prototype.push.apply(coords, [ item.geometry.coordinates[0], item.geometry.coordinates[1] ]);
  } else {
    Array.prototype.push.apply(coords, [ item.geocode_lon, item.geocode_lat ]);
  }
  MapStore.setMapZoom(18);
  MapStore.setMapCenter(coords);
};

const expandedData = () => {
  // let modalComputed = PropertyCard.computed;
  if (opaPublicData.value) {
    let opaPublicData = opaPublicData.value;
  
    return [
      {
        label: 'Zip Code',
        value: function(item) {
          let zip = item.properties ? item.properties.zip_code : item.zip_code.substring(0,5);
          return zip;
        },
      },
      {
        label: 'City',
        value: function() {
          return "Philadelphia";
        },
      },
      {
        label: 'State',
        value: function() {
          return "PA";
        },
      },
      {
        label: 'Improvement Area (SqFt)',
        value: function(item) {
          let livable_area = opaPublicData(state, item).total_livable_area
          if (typeof livable_area === 'undefined' || livable_area === "" || livable_area == null){
            return "";
          } else {
            return livable_area.toLocaleString('en-US', {
              maximumFractionDigits: 0,
            });;
          }
        },
      },
      {
        label: 'Land Area (SqFt)',
        value: function(item) {
          let total_area = opaPublicData(state, item).total_area
          if (typeof total_area === 'undefined' | total_area === ""){
            return "";
          } else {
              return total_area.toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    });;
          }
        },
      },
      {
        label: 'Building Condition',
        value: function(item) {
          const cond_code = function(conditionCode) {
            const condition = conditionCode  == 0 ? 'Not Applicable' :
              conditionCode  == 1 ? 'Newer Construction' :
                conditionCode  == 2 ? 'Rehabbed' :
                  conditionCode  == 3 ? 'Above Average' :
                    conditionCode  == 4 ? 'Average' :
                      conditionCode  == 5 ? 'Below Average' :
                        conditionCode  == 6 ? 'Poor' :
                          conditionCode  == 7 ? 'Sealed / Structurally Compromised' :
                            conditionCode  == 8 ? 'Sealed / Structurally Compromised' :
                              'Not available';
            return condition;
          };
          // 3/8/2024 - we set it to use exterior_condition instead of interior_condition
          // 3/18/2024 - we set it back to useing interior_condition
          let conditionCode = opaPublicData(state, item).interior_condition
          if (typeof conditionCode != 'undefined' && conditionCode != "") {
            return cond_code(conditionCode);
          } return "";
        },
      },
      {
        label: 'Building Description',
        value: function(item) {
          let descriptionNew = opaPublicData(state, item).building_code_description_new;
          let description = opaPublicData(state, item).building_code_description;
          if (typeof descriptionNew != 'undefined' && descriptionNew != "") {
            return descriptionNew;
          } else if (typeof description != 'undefined' && description != "") {
            return description;
          } else {
            return "";
          }
        },
      },
      {
        label: 'Homestead Exemption',
        value: function(item) {
          let homestead = opaPublicData(state, item).homestead_exemption
          if (typeof homestead != 'undefined' && homestead != "" ) {
            return homestead != null ?
                    homestead.toLocaleString('en-US', {
                      style: "currency",
                      currency:"USD",
                      minimumFractionDigits: 0,
                    }) : "";
          } return ""
        },
      },
      {
        label: 'OPA Account Number',
        value: function(item) {
          // console.log("line 761 item: ", item)
          if(typeof item.parcel_number != 'undefined') {
            return item.parcel_number
          } else {
            return item.properties.opa_account_num
          }
  
          // if (state.geocode.status === "success"){
          //   console.log("line 761 item: ", item)
          //   return item.properties.opa_account_num;
          // } else if (state.ownerSearch.status === "success") {
          //   return item.properties.opa_account_num;
          // }
          // return item.parcel_number;
  
        },
      },
      {
        label: 'Year Built',
        value: function(item){
            let yearBuilt = opaPublicData(state, item).year_built;
            if(typeof yearBuilt != 'undefined' && yearBuilt != ""){
              yearBuilt = yearBuilt === '0000'? 'Not Available' :
                          yearBuilt === null? 'Not Available' :
                          yearBuilt + (opaPublicData(state, item).year_built_estimate ? ' (estimated)' : '');
              return yearBuilt
            } return ''
        },
      },
      {
        label: 'Number of Stories',
        value: function(item){
          let opaPublicDataResult = opaPublicData(state, item);
          if(typeof opaPublicDataResult != 'undefined' && opaPublicDataResult != ""){
            return  opaPublicDataResult.number_stories === null ? "Not Available" :
                    opaPublicDataResult.number_stories.toString().length > 0 ?
                    opaPublicDataResult.number_stories === 0 ?
                    opaPublicDataResult.total_livable_area > 0 ? 'Not Available':
                    'None' :
                    opaPublicDataResult.number_stories === 1 ? '1 story' :
                    (opaPublicDataResult.number_stories + ' stories') : ''
          } return ''
        },
      },
      {
        label: 'Rooms',
        value: function(item){
          let rooms = opaPublicData(state, item).number_of_rooms;
          rooms = !(opaPublicData(state, item).total_livable_area > 0) ? 'None' :
                      typeof rooms === 'undefined' | rooms === null  ? 'Not Available' :
                      rooms;
          return rooms
          },
      },
      {
        label: 'Bedrooms',
        value: function(item){
          let bedrooms = opaPublicData(state, item).number_of_bedrooms;
          bedrooms = !(opaPublicData(state, item).total_livable_area > 0) ? 'None' :
                      typeof bedrooms === 'undefined' | bedrooms === null  ? 'Not Available' :
                      bedrooms;
          return bedrooms
          },
      },
      {
        label: 'Bathrooms',
        value: function(item){
          let bathrooms = opaPublicData(state, item).number_of_bathrooms;
          bathrooms = !(opaPublicData(state, item).total_livable_area > 0) ? 'None' :
                      typeof bathrooms === 'undefined' | bathrooms === null  ? 'Not Available' :
              bathrooms;
          return bathrooms
        },
      },
      {
          label: 'Features',
          value: function(item) {
            let basements, fireplaces, garages, buildings, view;
            let features = [];
  
            switch (opaPublicData(state, item).basements) {
            case null: basements= null;
              break;
            case '0': basements= null;
              break;
            case 'A': basements = 'Full Finished basement';
              break;
            case 'B': basements = 'Full Semi-finished basement';
              break;
            case 'C': basements = 'Full Unfinished basement';
              break;
            case 'D': basements = 'Full basement';
              break;
            case 'E': basements = 'Finished partial basement';
              break;
            case 'F': basements = 'Semi-finished partial basement';
              break;
            case 'G': basements = 'Unfinished partial basement';
              break;
            case 'H': basements = 'Partial basement';
              break;
            case 'I': basements = 'Finished basement';
              break;
            case 'J': basements = 'Unfinished basement';
              break;
            }
  
            fireplaces = opaPublicData(state, item).fireplaces === 1 ?
              opaPublicData(state, item).fireplaces + ' fireplace' :
              opaPublicData(state, item).fireplaces === 0 |
              opaPublicData(state, item).fireplaces === null |
              typeof opaPublicData(state, item).fireplaces === 'undefined' ? null :
              opaPublicData(state, item).fireplaces + ' fireplaces ';
  
            switch (opaPublicData(state, item).garage_type) {
            case null : garages = null;
              break;
            case '0' : garages = null;
              break;
            case 'A': garages = 'Built-in/Basement garage';
              break;
            case 'B': garages = 'Attached garage';
              break;
            case 'C': garages = 'Detached garage';
              break;
            case 'F': garages = 'Converted garage';
              break;
            case 'S': garages = 'Self-park garage';
              break;
            case 'T': garages = 'Attendant parking';
              break;
            }
  
            switch (opaPublicData(state, item).view_type) {
            case '0': view = null;
              break;
            case 'A': view = 'View of cityscape/skyline';
              break;
            case 'B': view = 'View of river/creek';
              break;
            case 'C': view = 'View of park/green area';
              break;
            case 'D': view = 'View of commercial area';
              break;
            case 'E': view = 'View of industrial area';
              break;
            case 'H': view = 'View of historic edifice or landmark';
              break;
            case 'I': view = null;
              break;
            case null : view = null;
              break;
            }
  
            garages = opaPublicData(state, item).garage_spaces === 1 ?
              garages + ' (' + opaPublicData(state, item).garage_spaces + ' space)' :
              opaPublicData(state, item).garage_spaces === 0 |
              opaPublicData(state, item).garage_spaces === null |
              typeof opaPublicData(state, item).garage_spaces === 'undefined'? null :
                garages + ' (' + opaPublicData(state, item).garage_spaces + ' spaces)';
  
            let toPush = [basements, fireplaces, garages, view];
            toPush.map(a => a != null ? features.push(a):'');
            return features.length === 0 ? 'None' : features.length === 1 ? features : features.join(', ');
        },
      },
      {
        label: 'Heating and Utilities',
        value: function(item){
  
  
            let heat = [];
  
            switch (opaPublicData(state, item).fuel) {
            case 'A' : heat.push('Natural gas heating');
              break;
            case 'B' : heat.push('Oil fuel heating');
              break;
            case 'C' : heat.push('Electric heating');
              break;
            case 'D' : heat.push('Coal heating');
              break;
            case 'E' : heat.push('Solar heating');
              break;
            case 'F' : heat.push('Woodstove heating');
              break;
            case 'G' : null;
              break;
            case 'H' : null;
              break;
            case null : null;
              break;
            }
  
            switch (opaPublicData(state, item).type_heater) {
            case 'A' : heat.push('Duct (heated air) heaters');
              break;
            case 'B' : heat.push('Radiator/baseboard (heated water) heaters');
              break;
            case 'C' : heat.push('Baseboard (electric) heaters');
              break;
            case 'D' : null;
              break;
            case 'E' : null;
              break;
            case 'F' : heat.push('Woodstove heating');
              break;
            case 'G' : heat.push('Radiant heaters');
              break;
            case 'H' : null;
              break;
            case null : null;
              break;
            }
  
            opaPublicData(state, item).central_air === 'Y' ? heat.push('Has central air') : null;
            opaPublicData(state, item).sewer === 'Y' ? heat.push( 'City sewer') : null;
  
            let heatOutput = [];
            heat.map(a => a != null ? heatOutput.push(a):'');
            return heatOutput.length === 0 ? '' : heatOutput.length === 1 ? heatOutput : heatOutput.join(', ');
  
            return heat.join('<br>');
  
        },
      },
      {
        label: 'Frontage',
        value: function(item) {
          let frontage =  opaPublicData(state, item).frontage === null ? 'Not Available ' :
            typeof opaPublicData(state, item).frontage === 'undefined' ? 'Not Available ' :
            opaPublicData(state, item).frontage.toFixed(0) + ' ft';
          return frontage
        },
      },
      {
        label: 'Beginning Point',
        value: function(item) {
          let point = opaPublicData(state, item).beginning_point;
          return point === null ? "":
            typeof point === 'undefined' ? "":
              point.replace(/"/g, '""').trim()
        },
      },
      {
        label: 'Zoning Code',
        value: function(item){
          let id = [];
          if(typeof item.parcel_number != 'undefined') {
            id = item.parcel_number
          } else {
            id =  item.properties.opa_account_num
          }
          // state.geocode.status === "success"?  id =  item.properties.opa_account_num :
          //   state.ownerSearch.status === "success" ? id =  item.properties.opa_account_num :
          //     id = item.parcel_number;
          if (typeof state.sources.opa_public.targets[id] != 'undefined' && id != "" && state.sources.opa_public.targets[id].data.zoning != null) {
            return state.sources.opa_public.targets[id].data.zoning.trim();
          } return "";
        },
      },
      {
        label: 'Zoning Description',
        value: function (state, item) {
          let id = [];
        if(typeof item.parcel_number != 'undefined') {
            id = item.parcel_number
          } else {
            id =  item.properties.opa_account_num
          }
          // state.geocode.status === "success"?  id =  item.properties.opa_account_num :
          //   state.ownerSearch.status === "success" ? id =  item.properties.opa_account_num :
          //     id = item.parcel_number;
          if (typeof state.sources.opa_public.targets[id] != 'undefined' && id != "" && state.sources.opa_public.targets[id].data.zoning != null) {
            const code = state.sources.opa_public.targets[id].data.zoning ;
            return helpers.ZONING_CODE_MAP[code.trim()];
          }  return "";
        },
      },
      {
        label: 'Ward',
        value: function(item) {
          return opaPublicData(state, item).political_ward;
        },
      },
      {
        label: 'Ward Division',
        value: function(item) {
          return opaPublicData(state, item).political_district;
        },
      },
      {
        label: 'Council District',
        value: function(item) {
          return opaPublicData(state, item).council_district_2024;
        },
      },
      {
        label: 'Elementary School',
        value: function(item) {
          return opaPublicData(state, item).elementary_school;
        },
      },
      {
        label: 'Middle School',
        value: function(item) {
          return opaPublicData(state, item).middle_school;
        },
      },
      {
        label: 'High School',
        value: function(item) {
          return opaPublicData(state, item).high_school;
        },
      },
      {
        label: 'Police District',
        value: function(item) {
          return opaPublicData(state, item).police_district;
        },
      },
    ];
  };
}; 

const getMailingFields = (item) => {
  const valueOptions = MainStore.lastSearchMethod === "shape search" ? shapeOptions.value :
    MainStore.lastSearchMethod === "owner search" ? ownerOptions.value :
      geocodeOptions.value;
  return  {
    fields: [
      {
        label: 'Owner',
        value: function(item) {
          let owner;
          MainStore.lastSearchMethod === "shape search" || MainStore.lastSearchMethod === "buffer search" ?
            owner = item.owner_2 != null ?
              titleCase(item.owner_1.trim()) + "\n" + titleCase(item.owner_2.trim()):
              titleCase(item.owner_1.trim()) :
            MainStore.lastSearchMethod === "owner search" ?
              owner = item.properties.opa_owners.map( a => titleCase(a)).join('\n') :
              owner = titleCase(item.properties.opa_owners.join(' \n '));
          return owner;
        },
      },
      {
        label: 'Street Address',
        value: function(item) {
          return valueOptions.fields.filter(item => item.label === 'Street Address')[0].value(state, item);
        },
      },
      {
        label: 'Zip Code',
        value: function(item) {
          let zip = item.properties ? item.properties.zip_code : item.zip_code.substring(0,5);
          return 'Philadelphia, PA' + zip;
        },
      },
    ],
  };
};


const table1 = {
  columns: [
    {
      label: 'Name',
      field: 'name',
    },
    {
      label: 'Age',
      field: 'age',
      type: 'number',
    },
    {
      label: 'Created On',
      field: 'createdAt',
      type: 'date',
      dateInputFormat: 'yyyy-MM-dd',
      dateOutputFormat: 'MMM do yy',
    },
    {
      label: 'Percent',
      field: 'score',
      type: 'percentage',
    },
  ],
  rows: [
    { id:1, name:"John", age: 20, createdAt: null, score: 0.03343 },
    { id:2, name:"Jane", age: 24, createdAt: '2011-10-31', score: 0.03343 },
    { id:3, name:"Susan", age: 16, createdAt: '2011-10-30', score: 0.03343 },
    { id:4, name:"Chris", age: 55, createdAt: '2011-10-11', score: 0.03343 },
    { id:5, name:"Dan", age: 40, createdAt: '2011-10-21', score: 0.03343 },
    { id:6, name:"John", age: 20, createdAt: '2011-10-31', score: 0.03343 },
  ],
}


const allColumns = [
  {
    label: 'Street Address',
    field: 'address',
  },
  {
    label: 'Market Value',
    field: 'market_value',
  },
  {
    label: 'Date of Last Sale',
    field: 'sale_date',
  },
  {
    label: 'Price of Last Sale',
    field: 'sale_price',
  },
  {
    label: 'Owner',
    field: 'owner_1',
  },
]

const allRows = [
  {
    address: '1234 Market St',
    market_value: '$100,000',
    sale_date: '01/01/2020',
    sale_price: '$200,000',
    owner_1: 'John Doe',
  },
  {
    address: '5678 Market St',
    market_value: '$200,000',
    sale_date: '02/01/2020',
    sale_price: '$300,000',
    owner_1: 'Jane Smith',
  },
]

const newRowClick = (props) => {
  console.log('newRowClick, props:', props);
};

</script>

<template>
  <div id="data-panel-container">
    <full-screen-data-toggle-tab
      id="lower-toggle-tab"
    />
    <div
      v-show="loadingData"
      class="spinner-div small-12 cell"
    >
      <font-awesome-icon
        icon="spinner"
        class="fa-4x"
        aria-hidden="true"
      />
      <h3>Loading Data</h3>
    </div>
    <horizontal-table
      v-show="!loadingData"
      v-if="lastSearchMethod === 'geocode' && opa && Object.keys(opa.targets).length || lastSearchMethod === 'reverseGeocode' && opa && Object.keys(opa.targets).length"
      padding-top="0"
      :slots="{
        items: geocodeItems,
        buttonFinished: function() {
          $data.showTable = true
          $data.buttonHide = true
        }
      }"
      :options="geocodeOptions"
    />
    <div
      v-if="lastSearchMethod === 'geocode' && !loadingData && geocode.status === 'success' && !Object.keys(opa.targets).length"
      class="no-opa-message"
    >
    <!-- v-if="lastSearchMethod === 'geocode' && !loadingData && geocode.status === 'success' && !Object.keys(opa.targets).length || lastSearchMethod === 'reverseGeocode' && !loadingData && geocode.status === 'success' && !Object.keys(opa.targets).length" -->
      This address could not be found using the information provided. Try using the property's OPA account number or try
      <a target="_blank" href="https://atlas.phila.gov">atlas.phila.gov</a>.
    </div>
    <horizontal-table
      v-show="!loadingData"
      v-if="lastSearchMethod === 'owner search'
        || lastSearchMethod === 'block search'"
      :slots="{
        items: function(state) {
          let data = [];
          if (state.lastSearchMethod === 'owner search') {
            data = state.ownerSearch.data;
          } else {
            data = state.blockSearch.data;
          }
          return data
        },
      }"
      :options="ownerOptions"
    />
    <horizontal-table
      v-show="!loadingData"
      v-if="lastSearchMethod === 'shape search' && DatafetchStore.shapeSearch.data !== null
        || lastSearchMethod === 'buffer search' && DatafetchStore.shapeSearch.data !== null"
      :slots="{
        items: function(state) {
          var data = state.shapeSearch.data.rows;
          return data;
        },
      }"
      :options="shapeOptions"
    />
  </div>
</template>

<style lang="scss">

.no-opa-message {
  padding: 1rem;
}

.faux-link {
  cursor: pointer;
  // color: color(dark-ben-franklin);
  font-weight: bold;
  div{
    text-decoration: underline !important
  }
}

@media print {
  #data-panel-container {
    display: none;
  }
}

.address-field .popover-link {
  border-bottom: 1px solid;
  color: #0f4d90;
}

a.button.owner-locate-button {
  float: right;
  color: #444;
  background-color: transparent;
  padding: 2px 3px 2px 5px;
}

.data-panel.container {
  justify-content: center;
}

.hide {
  display: none;
}

.spinner-div {
  padding-top: 40px;
  padding-bottom: 20px;
  text-align: center;
}

</style>
