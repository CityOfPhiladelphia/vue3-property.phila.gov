import { defineStore } from 'pinia';

const evaluateDataForUnits = (data) => {
  // console.log('condo-search-client evaluateDataForUnit, data:', data);

  var units = [], filteredData, dataList = [];
  let groupedData = _.groupBy(data, a => a.properties.pwd_parcel_id ? a.properties.pwd_parcel_id : a.properties.dor_parcel_id);

  for (let item in groupedData){
    units.push.apply(units, groupedData[item]);
    // groupedData[item].length > 1 ? units.push.apply(units,groupedData[item]) :
    // dataList.push(groupedData[item][0])
  }
  let mObj = JSON.parse(JSON.stringify(data[0]));

  units.length > 0 ? units = _.groupBy(units, a => a.properties.pwd_parcel_id ? a.properties.pwd_parcel_id : a.properties.dor_parcel_id) : "";
  Object.keys(units).length > 1 ? delete units[""] : "";
  this.store.commit('setUnits', units);

  return data;
};

const setFeatureProperties = (feature, totalUnits, units) => {
  console.log('geocode setFeatureProperties is running, feature:', feature, 'totalUnits:', totalUnits);
  // console.log('this.store.state.parcels.pwd[0].properties.ADDRESS:', this.store.state.parcels.pwd[0].properties.ADDRESS);

  feature.properties.opa_owners = [ "Condominium (" + totalUnits + " Units)" ];
  if (this.store.state.parcels.pwd) {
    feature.properties.street_address = this.store.state.parcels.pwd[0].properties.ADDRESS;
    feature.properties.opa_address = this.store.state.parcels.pwd[0].properties.ADDRESS;
    feature.properties.pwd_parcel_id = this.store.state.parcels.pwd[0].properties.PARCELID;
    feature._featureId = this.store.state.parcels.pwd[0].properties.PARCELID;
    feature.condo = true;
  } else {
    console.log('setFeatureProperties is still running', this.store.state.condoUnits.units[Object.keys(this.store.state.condoUnits.units)[0]][0]);
    let record = this.store.state.condoUnits.units[Object.keys(this.store.state.condoUnits.units)[0]][0];
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

  feature.condo = true;
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
    async checkAisData(parameter) {
      try {
        if (import.meta.env.VITE_DEBUG == 'true') console.log('checkAisData is running, parameter:', parameter);
        const response = await fetch(`https://api.phila.gov/ais/v1/search/${encodeURIComponent(parameter)}?include_units=false`)
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
    async fillAisData(address) {
      try {
        this.geocodeStatus = null;
        if (import.meta.env.VITE_DEBUG == 'true') console.log('Address - fillAisData is running, address:', address)
        const response = await fetch(`https://api.phila.gov/ais/v1/search/${encodeURIComponent(address)}?include_units=false`)
        if (response.ok) {
          let data = await response.json();
          let features = data.features;
          features.map((a, index) => a._featureId = 'feat-geocode-'+index);
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Address - await resolved and HTTP status is successful, data:', data, 'features:', features);
          this.aisData = data
          this.geocodeStatus = 'success';

          let feature = features.filter(a => a.match_type === 'exact').length > 0 ? features.filter(a => a.match_type === 'exact')[0] :features[0];
          let relatedFeatures = [];

          // The slice is needed for reverse geocode bc there is a prototype object to remove
          // However, in PDE the exact match needs to be filtered to get the correct parcel and route
          // Example property: 1111 Herbert St.
          let featureGroup = features[0].match_type === 'exact_key' ? features.slice(1) : features;
          for (let relatedFeature of featureGroup){
            if (feature.properties.address_high && relatedFeature.match_type !== 'exact') {
              if (relatedFeature.properties.address_high) {
                relatedFeatures.push(relatedFeature);
              }
            } else if (relatedFeature.match_type !== 'exact') {
              relatedFeatures.push(relatedFeature);
            }
          }
          // console.log('geocode success, relatedFeatures:', relatedFeatures);
          if (relatedFeatures.length > 0) {
            // console.log('if relatedFeatures is running');
            // feature.condo = true;
            // this.store.commit('setUnits', {
            //   [feature.properties.pwd_parcel_id]: features,
            // });
            let params = response.config.params;

            async function getPages(features) {

              let pages = Math.ceil(data.total_size / 100);
              console.log('getPages is running still going 2, url:', url, 'data:', data, 'pages:', pages);

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
              units = this.evaluateDataForUnits(units);
              // units.unshift(units[0]);
              console.log('units2:', units);

              var feature = JSON.parse(JSON.stringify(units[0]));
              for (let i in feature.properties) {
                feature.properties[i] = "";
              }

              if(ParcelsStore.pwd === null) {
                this.setFeatureProperties(feature, totalUnits, units);

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
                this.setFeatureProperties(feature, totalUnits);

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
              // }
            }

            let exactMatch = features.filter(a => a.match_type === 'exact');
            // console.log("exactMatch: ", exactMatch);
            getPages = getPages.bind(this);
            if (this.config.app && !exactMatch.length > 0) {
            // if (this.config.app && !exactMatch.length > 0 && this.config.app.title === 'Property Data Explorer') {
              return getPages(features);
            }

            this.related = relatedFeatures;

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