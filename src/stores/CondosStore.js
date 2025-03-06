import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
import axios from 'axios';

const evaluateDataForUnits = (data) => {
  // console.log('condo-search-client evaluateDataForUnit, data:', data);

  var units = [], filteredData, dataList = [];
  let groupedData = Object.groupBy(data, a => a.properties.pwd_parcel_id);

  for (let item in groupedData){
    units.push.apply(units, groupedData[item]);
    // groupedData[item].length > 1 ? units.push.apply(units,groupedData[item]) :
    // dataList.push(groupedData[item][0])
  }
  let mObj = JSON.parse(JSON.stringify(data[0]));

  units.length > 0 ? units = Object.groupBy(units, a => a.properties.pwd_parcel_id) : "";
  this.CondoUnits.units = units;

  return data;
}

const setFeatureProperties = (feature, totalUnits) => {
  console.log('condo setFeatureProperties is running, feature:', feature, 'totalUnits:', totalUnits);
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

}

export const useCondosStore = defineStore('CondosStore', {
  state: () => {
    return {
      condosData: {
        page_count: 0,
        total_size: 0,
        pages: {
          page_1: { features: [] },
        },
      },
      condoUnits: {
        units: {},
      },
      dataPageFilled: null,
      lastPageUsed: 1,
      loadingCondosData: false,
    };
  },
  actions: {
    setUnits(units) {
      this.condoUnits.units = units;
    },
    async getPages(features) {
      console.log('getPages is running still going 2, pages:' );

      let pages = Math.ceil(data.total_size / 100);

      if (pages > 1) {
        for (let counter = 2; counter<=pages; counter++) {
          // console.log('in loop, counter:', counter, this);
          params.page = counter;
          let pageResponse = await axios.get(url, { params });
          features = await features.concat(pageResponse.data.features);
          // console.log('response:', pageResponse, 'features:', features)
        }
      }

      let units = features.filter(a => a.properties.unit_num != "");
      units = evaluateDataForUnits(units);

      var feature = JSON.parse(JSON.stringify(units[0]));
      for (let i in feature.properties) {
        feature.properties[i] = "";
      }

      if(this.store.state.parcels.pwd === null) {
        setFeatureProperties(feature, totalUnits);

        console.log('condo-search-client, getPages else is still running 1');
        store.commit('setGeocodeData', feature);
        store.commit('setGeocodeStatus', 'success');
        // console.log('getPages else is still running 2');
        if (this.store.state.lastSearchMethod !== 'reverseGeocode') {
          this.store.commit('setLastSearchMethod', 'geocode');
        }
        // console.log('feature:', feature);
      } else {
        setFeatureProperties(feature, totalUnits);

        console.log('condo-search-client getPages else is still running 1');
        store.commit('setGeocodeData', feature);
        store.commit('setGeocodeStatus', 'success');
        // console.log('getPages else is still running 2');
        if (this.store.state.lastSearchMethod !== 'reverseGeocode') {
          this.store.commit('setLastSearchMethod', 'geocode');
        }
        // console.log('feature:', feature);
      }

      this.store.commit('setCondoUnitsStatus', 'success');
      return feature;
      // }
    },
    async fillCondoData(address, page = 1) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillCondoData is running, address', address, 'page:', page);
      try {
        const GeocodeStore = useGeocodeStore();
        const AddressLoaded = GeocodeStore.aisData.features
        if (!AddressLoaded) { return }
        const aisData = AddressLoaded[0];
        let params = {
          include_units: true,
          opa_only: true,
          sort_field: 'street_address',
          page: page,
        };
        const response = await axios(`https://api.phila.gov/ais/v1/search/${encodeURIComponent(address)}`, { params });
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('condos response:', response);
        if (response.status === 200) {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Condos - await resolved and HTTP status is successful')
          this.dataPageFilled = page;
          if (response.data.features.length > 0) {
            let newData = {
              // page_count: response.data.page_count,
              // total_size: response.data.total_size,
              features: [],
            }
            // if (import.meta.env.VITE_DEBUG == 'true') console.log('in condo-list, data:', data, 'state:', state);
            for (let feature of response.data.features) {
              // if (import.meta.env.VITE_DEBUG == 'true') console.log('feature.properties.address_low_frac:', feature.properties.address_low_frac, 'aisData.properties.address_low_frac:', aisData.properties.address_low_frac, 'feature.properties.street_address:', feature.properties.street_address, 'aisData.properties.street_address:', aisData.properties.street_address);
              if (feature.properties.address_low_frac !== aisData.properties.address_low_frac || feature.properties.street_address === aisData.properties.street_address) {
                // return;
                response.data.total_size = response.data.total_size - 1;
              } else {
                newData.features.push(feature);
              }
            }
            if (page === 1) {
              this.condosData.page_count = response.data.page_count;
              this.condosData.total_size = response.data.total_size;
            }
            console.log('aisData:', aisData, 'aisData.properties.pwd_parcel_id:', aisData.properties.pwd_parcel_id, 'newData:', newData);
            this.condoUnits.units[aisData.properties.pwd_parcel_id] = newData;
          }
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.log('Condos - await resolved but no data features')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('Condos - await never resolved, failed to fetch condo data')
      }
    },
  }
})