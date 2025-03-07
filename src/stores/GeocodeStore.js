import { defineStore } from 'pinia';

import { useCondosStore } from '@/stores/CondosStore.js'
import { useMainStore } from '@/stores/MainStore.js'
import { useParcelsStore } from '@/stores/ParcelsStore.js'

import axios from 'axios';

const evaluateDataForUnits = (data) => {
  const CondosStore = useCondosStore();
  // console.log('condo-search-client evaluateDataForUnit, data:', data);

  var units = [], filteredData, dataList = [];
  let groupedData = Object.groupBy(data, a => a.properties.pwd_parcel_id ? a.properties.pwd_parcel_id : a.properties.dor_parcel_id);

  for (let item in groupedData){
    units.push.apply(units, groupedData[item]);
    // groupedData[item].length > 1 ? units.push.apply(units,groupedData[item]) :
    // dataList.push(groupedData[item][0])
  }
  let mObj = JSON.parse(JSON.stringify(data[0]));

  units.length > 0 ? units = Object.groupBy(units, a => a.properties.pwd_parcel_id ? a.properties.pwd_parcel_id : a.properties.dor_parcel_id) : "";
  Object.keys(units).length > 1 ? delete units[""] : "";
  CondosStore.setUnits(units);

  return data;
};

const setFeatureProperties = (feature, totalUnits, units) => {
  const ParcelsStore = useParcelsStore();
  const CondosStore = useCondosStore();
  console.log('geocode setFeatureProperties is running, feature:', feature, 'totalUnits:', totalUnits);
  // console.log('ParcelsStore.pwd[0].properties.ADDRESS:', ParcelsStore.pwd[0].properties.ADDRESS);

  feature.properties.opa_owners = [ "Condominium (" + totalUnits + " Units)" ];
  if (Object.keys(ParcelsStore.pwd).length) {
    feature.properties.street_address = ParcelsStore.pwd[0].properties.ADDRESS;
    feature.properties.opa_address = ParcelsStore.pwd[0].properties.ADDRESS;
    feature.properties.pwd_parcel_id = ParcelsStore.pwd[0].properties.PARCELID;
    feature._featureId = ParcelsStore.pwd[0].properties.PARCELID;
    feature.condo = true;
  } else {
    console.log('setFeatureProperties is still running', CondosStore.condoUnits.units[Object.keys(CondosStore.condoUnits.units)[0]][0]);
    let record = CondosStore.condoUnits.units[Object.keys(CondosStore.condoUnits.units)[0]][0];
    console.log("No pwd parcels, showing feature: ", record, record.properties);
    let address = record.properties.address_low + " " + record.properties.street_full;
    let parcelId = record.properties.dor_parcel_id;

    feature.properties.street_address = address;
    feature.properties.opa_address = address;
    // feature.properties.pwd_parcel_id = parcelId;
    feature.properties.dor_parcel_id = parcelId;
    feature._featureId = parcelId;
    feature.condo = true;
  }

  // feature.condo = true;
  // console.log('setFeatureProperties is ending');
}

export const useGeocodeStore = defineStore("GeocodeStore", {
  state: () => {
    return {
      aisDataChecked: {},
      aisData: {},
      geocodeStatus: null,
      related: [],
    };
  },

  actions: {
    setGeocodeRelated(data) {
      this.related = data;
    },
    async checkAisData(parameter) {
      try {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('checkAisData is running, parameter:', parameter);
        let params = {
          include_units: true,
          opa_only: true,
          sort_field: 'street_address',
          page: page,
        };
        const response = await fetch(`https://api.phila.gov/ais-pde/v1/search/${encodeURIComponent(parameter)}`, { params });
        if (response.ok) {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('check AIS - await resolved and HTTP status is successful')
          this.aisDataChecked = await response.json()
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('check AIS - await resolved but HTTP status was not successful')
          this.aisDataChecked = {}
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('check AIS - await never resolved, failed to fetch address data')
      }
    },
    async getPages(features, data) {
      const MainStore = useMainStore();
      const ParcelsStore = useParcelsStore();
      const totalUnits = data.total_size;

      let pages = Math.ceil(data.total_size / 100);
      console.log('getPages is running still going 2, data:', data, 'pages:', pages);

      if (pages > 1) {
        console.log('if pages > 1 is running');
        for (let counter = 2; counter<=pages; counter++) {
          console.log('in loop, counter:', counter, 'this:', this, 'params:', params);
          params.page = counter;
          console.log('right before axios, url:', url);
          let pageResponse = await axios.get(url, { params });
          features = await features.concat(pageResponse.data.features);
          // console.log('response:', pageResponse, 'features:', features)
        }
      }

      let units = features.filter(a => a.properties.unit_num != "");
      console.log('units1:', units);
      units = evaluateDataForUnits(units);
      // units.unshift(units[0]);
      console.log('units2:', units);

      var feature = JSON.parse(JSON.stringify(units[0]));
      for (let i in feature.properties) {
        feature.properties[i] = "";
      }

      if(!Object.keys(ParcelsStore.pwd).length) {
        setFeatureProperties(feature, totalUnits, units);

        console.log('getPages if is running, feature:', feature);
        feature.condo = true;
        this.aisData = feature;
        this.geocodeStatus = 'success';
        // console.log('getPages else is still running 2');
        if (MainStore.lastSearchMethod !== 'reverseGeocode') {
          MainStore.setLastSearchMethod('geocode');
        }
        // console.log('feature:', feature);
      } else {
        console.log('getPages else is running, feature:', feature);
        setFeatureProperties(feature, totalUnits);

        // console.log('getPages else is still running 1');
        this.aisData = feature;
        this.geocodeStatus = 'success';
        // console.log('getPages else is still running 2');
        if (MainStore.lastSearchMethod !== 'reverseGeocode') {
          MainStore.lastSearchMethod = 'geocode';
        }
        // console.log('feature:', feature);
      }
      return feature;
    },
    async fillAisData(address) {
      try {
        const CondosStore = useCondosStore();
        const MainStore = useMainStore();
        this.geocodeStatus = null;
        let params = {
          include_units: true,
          opa_only: true,
          sort_field: 'street_address',
        };
        // page: page,
        if (import.meta.env.VITE_DEBUG == 'true') console.log('Address - fillAisData is running, address:', address, 'params:', params);
        const response = await axios(`https://api.phila.gov/ais-pde/v1/search/${encodeURIComponent(address)}`, { params });
        if (response.status === 200) {
          console.log('ok');
          let data = await response.data;
          let features = data.features;
          features.map((a, index) => a._featureId = 'feat-geocode-'+index);
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Address - await resolved and HTTP status is successful, data:', data, 'features:', features);
          
          // this.aisData = data
          this.geocodeStatus = 'success';

          let feature = features.filter(a => a.match_type === 'exact').length > 0 ? features.filter(a => a.match_type === 'exact')[0] : features[0];
          this.aisData = feature;
          let relatedFeatures = [];
          
          // The slice is needed for reverse geocode bc there is a prototype object to remove
          // However, in PDE the exact match needs to be filtered to get the correct parcel and route
          // Example property: 1111 Herbert St.
          let featureGroup = features[0].match_type === 'exact_key' ? features.slice(1) : features;
          for (let relatedFeature of featureGroup){
            console.log('feature:', feature, 'relatedFeature:', relatedFeature);
            if (feature.properties.address_high && relatedFeature.match_type !== 'exact') {
              if (relatedFeature.properties.address_high) {
                relatedFeatures.push(relatedFeature);
              }
            } else if (relatedFeature.match_type !== 'exact') {
              relatedFeatures.push(relatedFeature);
            }
          }
          console.log('geocode success, relatedFeatures:', relatedFeatures);
          if (relatedFeatures.length > 0) {
            // console.log('if relatedFeatures is running');
            MainStore.condoSearched = true;
            // feature.condo = true;
            CondosStore.setUnits({
              [feature.properties.pwd_parcel_id]: features,
            });
            // let params = response.config.params;

            let exactMatch = features.filter(a => a.match_type === 'exact');
            // console.log("exactMatch: ", exactMatch);
            // getPages = getPages.bind(this);
            if (!exactMatch.length > 0) {
            // if (this.config.app && !exactMatch.length > 0 && this.config.app.title === 'Property Data Explorer') {
              return this.getPages(features, data);
            }

            this.related = relatedFeatures;
          } else {
            MainStore.condoSearched = false;
          }

        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Address - await resolved but HTTP status was not successful')
          this.aisData = {}
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('Address - await never resolved, failed to fetch address data')
      }
    },
  },
  getters: {
  },

});