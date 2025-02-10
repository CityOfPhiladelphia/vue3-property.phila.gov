import { defineStore } from 'pinia';
import { useGeocodeStore } from '@/stores/GeocodeStore.js'

import useTransforms from '@/composables/useTransforms';
const { titleCase, prettyNumber, currency, date } = useTransforms();

export const useOpaStore = defineStore('OpaStore', {
  state: () => {
    return {
      opa_assessment: {
        status: null,
        targets: {},
      },
      opa_public: {
        status: null,
        targets: {},
      },
      activeSearch: {
        assessmentHistory: {},
        salesHistory: {},
      },
      // assessmentHistory: {},
      loadingOpaData: true,
    };
  },
  actions: {
    async clearAllOpaData() {
      this.loadingOpaData = true;
      this.opa_assessment = {
        status: null,
        targets: {},
      },
      this.opa_public = {
        status: null,
        targets: {},
      },
      this.activeSearch = {
        assessmentHistory: {},
        salesHistory: {},
      },
      this.assessmentHistory = {};
    },
    async fillOpaPublic() {
      try {
        const GeocodeStore = useGeocodeStore();
        const opaNum = GeocodeStore.aisData.features[0].properties.opa_account_num;
        const response = await fetch(`https://phl.carto.com/api/v2/sql?q=select+*+from+opa_properties_public_pde+where+parcel_number+%3D+%27${opaNum}%27`);
        if (response.ok) {
          let data = await response.json();
          if (import.meta.env.VITE_DEBUG) console.log('data:', data);
          for (let row of data.rows) {
            this.opa_public.targets[row.parcel_number] = row;
          }
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('opaData - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('opaData - await never resolved, failed to fetch address data')
      }
    },
    async fillOpaAssessment() {
      try {
        const GeocodeStore = useGeocodeStore();
        const opaNum = GeocodeStore.aisData.features[0].properties.opa_account_num;
        const response = await fetch(`https://phl.carto.com/api/v2/sql?q=select+*+from+opa_properties_public_pde+where+parcel_number+%3D+%27${opaNum}%27`);
        if (response.ok) {
          let data = await response.json();
          if (import.meta.env.VITE_DEBUG) console.log('data:', data);
          for (let row of data.rows) {
            this.opa_assessment.targets[row.parcel_number] = row;
          }
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('opaData - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('opaData - await never resolved, failed to fetch address data')
      }
    },
    async fillActiveSearchAssessmentHistory() {
      try {
        const GeocodeStore = useGeocodeStore();
        const opaNum = GeocodeStore.aisData.features[0].properties.opa_account_num;
        const response = await fetch(`https://phl.carto.com/api/v2/sql?q=select+*+from+assessments+where+parcel_number+IN('${opaNum}')`);
        if (response.ok) {
          let data = await response.json();
          if (import.meta.env.VITE_DEBUG) console.log('activeSearchAssessmentHistory data:', data);
          for (let row of data.rows) {
            this.activeSearch.assessmentHistory.data = data.rows;
            this.activeSearch.assessmentHistory.status = 'success';
          }
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('activeSearchAssessmentHistory - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('activeSearchAssessmentHistory - await never resolved, failed to fetch address data')
      }
    },
    async fillActiveSearchSalesHistory() {
      try {
        const GeocodeStore = useGeocodeStore();
        const opaNum = GeocodeStore.aisData.features[0].properties.opa_account_num;
        if (import.meta.env.VITE_DEBUG) console.log('fillActiveSearchSalesHistory OpaNum:', opaNum);
        let query = `select+*+from+RTT_SUMMARY+where+opa_account_num+%3D+%27${opaNum}%27+AND+document_type+%3D+%27DEED%27`;
        if (import.meta.env.VITE_DEBUG) console.log('fillActiveSearchSalesHistory opaNum:', opaNum, 'query:', query);
        const response = await fetch(`https://phl.carto.com/api/v2/sql?q=${query}`);
        if (response.ok) {
          let data = await response.json();
          if (import.meta.env.VITE_DEBUG) console.log('activeSearchSalesHistory data:', data);
          for (let row of data.rows) {
            this.activeSearch.salesHistory.data = data.rows;
            this.activeSearch.salesHistory.status = 'success';
          }
        } else {
          if (import.meta.env.VITE_DEBUG == 'true') console.warn('activeSearchSalesHistory - await resolved but HTTP status was not successful')
        }
      } catch {
        if (import.meta.env.VITE_DEBUG == 'true') console.error('activeSearchSalesHistory - await never resolved, failed to fetch address data')
      }
    },
    // async fillAssessmentHistory() {
    //   try {
    //     const GeocodeStore = useGeocodeStore();
    //     const OpaNum = GeocodeStore.aisData.features[0].properties.opa_account_num;
    //     const response = await fetch(`https://phl.carto.com/api/v2/sql?q=select+*+from+assessments+where+parcel_number+%3D+%27${OpaNum}%27`);
    //     if (response.ok) {
    //       this.assessmentHistory = await response.json();
    //     } else {
    //       if (import.meta.env.VITE_DEBUG == 'true') console.warn('assessmentHistory - await resolved but HTTP status was not successful')
    //     }
    //   } catch {
    //     if (import.meta.env.VITE_DEBUG == 'true') console.error('assessmentHistory - await never resolved, failed to fetch address data')
    //   }
    // }
  },
  // keeping formatting getters here in the store only works if the data is not looped
  // through for a horizontal table
  // getters: {
  //   getMarketValue: (state) => {
  //     if (state.opaData.rows && state.opaData.rows[0]) {
  //       return currency(state.opaData.rows[0].market_value || null);
  //     }
  //   },
  //   getSaleDate: (state) =>  {
  //     if (state.opaData.rows && state.opaData.rows[0]) {
  //       return date(state.opaData.rows[0].sale_date);
  //     }
  //   },
  //   getSalePrice: (state) => {
  //     if (state.opaData.rows && state.opaData.rows[0]) {
  //       return currency(state.opaData.rows[0].sale_price);
  //     }
  //   },
  //   getHomesteadExemption: (state) => {
  //     if (state.opaData.rows && state.opaData.rows[0]) {
  //       return state.opaData.rows[0].homestead_exemption > 0 ? state.opaData.rows[0].homestead_exemption : 'No';
  //     }
  //   },
  //   getDescription: (state) => {
  //     if (state.opaData.rows && state.opaData.rows[0]) {
  //       return titleCase(state.opaData.rows[0].building_code_description_new);
  //     }
  //   },
  //   getCondition: (state) => {
  //     if (state.opaData.rows && state.opaData.rows[0]) {
  //       const exterior = state.opaData.rows[0].exterior_condition;
  //       const condition =  exterior  == 0 ? 'Not Applicable' :
  //         exterior == 2 ? 'Newer Construction / Rehabbed' :
  //           exterior == 3 ? 'Above Average' :
  //             exterior == 4 ? 'Average' :
  //               exterior == 5 ? 'Below Average' :
  //                 exterior == 6 ? 'Vacant' :
  //                   exterior == 7 ? 'Sealed / Structurally Compromised, Open to the Weather' :
  //                     'Not available';
  //       return condition;
  //     }
  //   },
  //   getBeginningPoint: (state) => {
  //     if (state.opaData.rows && state.opaData.rows[0]) {
  //       return titleCase(state.opaData.rows[0].beginning_point);
  //     }
  //   },
  //   getLandArea: (state) => {
  //     if (state.opaData.rows && state.opaData.rows[0]) {
  //       return prettyNumber(state.opaData.rows[0].total_area) + ' sq ft';
  //     }
  //   },
  //   getImprovementArea: (state) => {
  //     if (state.opaData.rows && state.opaData.rows[0]) {
  //       return prettyNumber(state.opaData.rows[0].total_livable_area) + ' sq ft';
  //     }
  //   },
  // },
})