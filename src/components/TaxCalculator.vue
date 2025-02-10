<script setup>

import { useMainStore } from '@/stores/MainStore.js';
const MainStore = useMainStore();
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();
import { useDatafetchStore } from '@/stores/DatafetchStore.js';
const DatafetchStore = useDatafetchStore();
import { useOpaStore } from '@/stores/OpaStore.js';
const OpaStore = useOpaStore();

import { ref, computed, onMounted, watch } from 'vue';

// Dollar conversion for 2023 Property Tax Estimator
const dollarUSLocale = Intl.NumberFormat('en-US', {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

let thisYear = new Date().getFullYear();

const selectedTaxYear = ref(thisYear);
const selectedExemption = ref('none');
const currentTaxRate = ref(0.013998);
const selectedSeniorYear = ref(thisYear);
const homesteadDeduction = {
  2025: 100000,
  2024: 80000,
  2023: 80000,
  2022: 45000,
  2021: 45000,
  2020: 45000,
  2019: 40000,
  2018: 30000,
};

onMounted(async () => {
  console.log('TaxCalculator.vue mounted, nextYear.value:', nextYear.value, 'currentYear.value:', currentYear.value);
  if (nextYear.value) {
    selectedTaxYear.value = nextYear.value;
    selectedSeniorYear = nextYear.value;
  } else {
    selectedTaxYear.value = currentYear.value;
    selectedSeniorYear.value = currentYear.value;
  }
});

//computed
const currentYear = computed(() => {
  return new Date().getFullYear();
});

const assessmentHistory = computed(() => {
  return OpaStore.activeSearch.assessmentHistory.data;
});

const lastAssessmentYear = computed(() => {
  if (assessmentHistory.value && assessmentHistory.value.length > 0) {
    return assessmentHistory.value[0].year;
  }
});

const nextYear = computed(() => {
  let value = null;
  if (lastAssessmentYear.value && currentYear.value < lastAssessmentYear.value) {
    value = currentYear.value + 1;
  }
  return value;
});

const lastYear = computed(() => {
  return currentYear.value - 1;
});

const hasHomestead = computed(() => {
  return activeOpaData.value.homestead_exemption > 0;
});

const currentSelected = computed(() => {
  return selectedExemption.value == 'current';
});

const noneSelected = computed(() => {
  return selectedExemption.value == 'none';
});

const homesteadSelected = computed(() => {
  return selectedExemption.value == 'homestead';
});

const loopSelected = computed(() => {
  return selectedExemption.value == 'loop';
});

const seniorSelected = computed(() => {
  return selectedExemption.value == 'senior';
});

const seniorYears = computed(() => {
  let years = [];
  for (let i=selectedTaxYear.value; i>=2018; i--) {
    years.push(i);
  }
  return years;
});

const lowIncomeSelected = computed(() => {
  return selectedExemption.value == 'lowIncome';
});

const assessmentValuesByYear = computed(() => {
  let values = {};
  for (let item of assessmentHistory.value) {
    values[item.year] = item.market_value;
  }
  console.log('assessmentValuesByYear, values:', values);
  return values;
});

const allValuesPreviousFiveYears = computed(() => {
  let selectedYear = parseInt(selectedTaxYear.value);
  let values = [];
  for (let i=selectedYear-1; i>=selectedYear-5; i--) {
    values.push(assessmentValuesByYear.value[i]);
  }
  return values;
});

const lowestValuePreviousFiveYears = computed(() => {
  return Math.min(...allValuesPreviousFiveYears.value);
});

const selectedYearValue = computed(() => {
  return assessmentHistory.value.filter(item => item.year == parseInt(selectedTaxYear.value))[0].market_value;
});

const previousYearValue = computed(() => {
  return assessmentHistory.value.filter(item => item.year == parseInt(selectedTaxYear.value) - 1)[0].market_value;
});

const loopOneFiveValue = computed(() => {   
  return selectedYearValue.value/previousYearValue.value;
});

const loopOneFiveEligible = computed(() => {
  return loopOneFiveValue.value >= 1.5;
});

const loopOneSevenFiveValue = computed(() => {
  const currentYearData = assessmentHistory.value.filter(item => item.year == parseInt(selectedTaxYear.value))[0];
  return currentYearData.market_value/lowestValuePreviousFiveYears.value;
});

const loopOneSevenFiveEligible = computed(() => {
  return loopOneSevenFiveValue.value >= 1.75;
});

const loopEitherEligible = computed(() => {
  return loopOneFiveEligible.value || loopOneSevenFiveEligible.value; 
});

const loopBothEligible = computed(() => {
  return loopOneFiveEligible.value && loopOneSevenFiveEligible.value;
});

const loopBase = computed(() => {
  if (loopBothEligible.value && loopOneFiveValue.value <= loopOneSevenFiveValue.value) {
    return previousYearValue.value;
  } else if (loopBothEligible.value && loopOneFiveValue.value < loopOneSevenFiveValue.value) {
    return lowestValuePreviousFiveYears.value;
  } else if (!loopBothEligible.value && loopOneSevenFiveEligible.value) {
    return lowestValuePreviousFiveYears.value;
  } else if (!loopBothEligible.value && loopOneFiveEligible.value) {
    return previousYearValue.value;
  } else {
    return selectedYearValue.value;
  }
});

const loopEligibilityUsed = computed(() => {
  if (loopBothEligible.value && loopOneFiveValue.value <= loopOneSevenFiveValue.value) {
    return 'oneFive';
  } else if (loopBothEligible.value && loopOneFiveValue.value > loopOneSevenFiveValue.value) {
    return 'oneSevenFive';
  } else if (!loopBothEligible.value && loopOneSevenFiveEligible.value) {
    return 'oneSevenFive';
  } else if (!loopBothEligible.value && loopOneFiveEligible.value) {
    return 'oneFive';
  } else {
    return 'none';
  }
});

const rawPayment = computed(() => {
  return selectedYearValue.value * currentTaxRate.value;
});

const loopCurrentYearPayment = computed(() => {
  if (loopEligibilityUsed.value == 'oneFive') {
    return loopBase.value * 1.5 * currentTaxRate.value;
  } else if (loopEligibilityUsed.value == 'oneSevenFive') {
    return loopBase.value * 1.75 * currentTaxRate.value;
  } else {
    return rawPayment.value;
  }
});

const loopAssessmentCap = computed(() => {
  if (loopEligibilityUsed.value == 'oneFive') {
    return dollarUSLocale.format(loopBase.value * 1.5);
  } else if (loopEligibilityUsed.value == 'oneSevenFive') {
    return dollarUSLocale.format(loopBase.value * 1.75);
  } else {
    return null;
  }
});

const loopOverride = computed(() => {
  if (loopBase.value > selectedYearValue.value) {
    return true;
  } else {
    return false;
  }
});

const taxableValue = computed(() => {
  let value = '';
  let marketValueUsed;
  if (assessmentHistory.value && assessmentHistory.value.length > 0) {
    let assessmentData = assessmentHistory.value.filter(item => item.year == parseInt(selectedTaxYear.value))[0];
    if (currentSelected.value) {
      marketValueUsed = assessmentData.market_value
        - assessmentData.exempt_land
        - assessmentData.exempt_building
    } else if (noneSelected.value) {
      marketValueUsed = assessmentData.market_value;
    } else if (homesteadSelected.value) {
      marketValueUsed = assessmentData.market_value - homesteadDeduction.value[selectedTaxYear.value];
      // console.log('taxableValue is running, marketValueUsed:', marketValueUsed, 'homestead.value:', homestead.value, 'exempt_land: ', activeOpaData.value.exempt_land, 'exempt_improvement: ', activeOpaData.value.exempt_building, activeOpaData.value);
    } else if (loopSelected.value) {
      if (loopEitherEligible.value) {
        if (loopOverride.value) {
          marketValueUsed = rawPayment.value;
        } else {
          marketValueUsed = loopCurrentYearPayment.value;
        }
      } else {
        marketValueUsed = 'Not eligible';
      }
    } else if (lowIncomeSelected.value) {
      let lastYear = assessmentValuesByYear.value[selectedTaxYear.value-1] - homesteadDeduction.value[selectedTaxYear.value-1];
      let thisYear = assessmentValuesByYear.value[selectedTaxYear.value] - homesteadDeduction.value[selectedTaxYear.value];
      marketValueUsed = thisYear > lastYear ? lastYear : thisYear;
    } else if (seniorSelected.value) {
      marketValueUsed = assessmentValuesByYear.value[selectedSeniorYear.value] - homesteadDeduction.value[selectedSeniorYear.value];
    }
  }
  marketValueUsed = marketValueUsed < 0 ? 0 : marketValueUsed;
  if (!loopSelected.value) {
    value = isNaN(marketValueUsed) ? marketValueUsed : dollarUSLocale.format(marketValueUsed * currentTaxRate.value);
  } else {
    value = isNaN(marketValueUsed) ? marketValueUsed : dollarUSLocale.format(marketValueUsed);
  }
  return value;
});

const activeOpaData = computed(() => {
  let value = [];
  if (OpaStore.opa_public.targets[activeOpaId.value] && OpaStore.opa_public.targets[activeOpaId.value].data) {
    value = OpaStore.opa_public.targets[activeOpaId.value].data;
  }
  return value;
});

const lastSearchMethod = computed(() => {
  return MainStore.lastSearchMethod;
});

const activeModalFeature = computed(() => {
  return MainStore.activeModalFeature;
});

const activeOpaId = computed(() => {
  let feature = activeModalFeature.value;
  let opaId;
  if (feature && ![ 'geocode', 'reverseGeocode', 'owner search', 'block search' ].includes(lastSearchMethod.value)) {
    opaId = feature.parcel_number;
  } else if (feature) {
    opaId = feature.properties.opa_account_num;
  }
  return opaId;
});

watch(
  () => selectedTaxYear,
  (newYear, oldYear) => {
    // console.log('oldYear:', oldYear, 'newYear:', newYear, 'selectedSeniorYear.value:', selectedSeniorYear.value);
    if (selectedSeniorYear.value > newYear) {
      selectedSeniorYear.value = newYear;
    }
  }
);


</script>

<template>
  <!-- Property Tax Calculator -->
  <div class="tax-calc-section has-background-ben-franklin-blue-light hide-print">
    <div>
      <h3>
        <b>Real Estate Tax Estimator</b>
      </h3>
      <div class="tax-year-container">
        <label for="tax_year">Assessment Year</label>
        <select
          name="tax_year"
          id="tax_year"
          ref='tax_year'
          v-model="selectedTaxYear"
        >
          <option v-if="!nextYear" :value="lastYear">{{ lastYear }}</option>
          <option :value="currentYear">{{ currentYear }}</option>
          <option v-if="nextYear" :value="nextYear">{{ nextYear }}</option>
        </select>
      </div>
      <p>
        <!-- If you’ve purchased your home within the last year, please contact the Hotline for information and assistance at (215) 686-9200. -->
        Homeowners may be eligible for programs to help reduce your taxes, like the
        <a target="_blank" href="https://www.phila.gov/services/payments-assistance-taxes/payment-plans-and-assistance-programs/other-payment-plans-and-programs/get-the-homestead-exemption/">Homestead Exemption</a>,
        <a target="_blank" href="https://www.phila.gov/services/payments-assistance-taxes/income-based-assistance-programs/longtime-owner-occupants-program/">
        Long-time Owner Occupant Program (LOOP)</a>,
        <a target="_blank" href="https://www.phila.gov/services/payments-assistance-taxes/senior-citizen-discounts/low-income-senior-citizen-real-estate-tax-freeze/">
        Senior Citizen Tax Freeze</a>, or
        <a target="_blank" href="https://www.phila.gov/services/payments-assistance-taxes/taxes/property-and-real-estate-taxes/get-real-estate-tax-relief/tax-freeze/apply-for-the-low-income-real-estate-tax-freeze/">
        Low-Income Tax Freeze</a>.
        For information and assistance, contact (215) 686-9200 for questions about Homestead, LOOP, or the Office of Property Assessment (OPA). For other Real Estate Tax questions, contact the Dept of Revenue at (215) 686-6442.
      </p>
      <!-- <p>
        In 2024, the City expanded the assistance program and created a <a target="_blank" href="https://www.phila.gov/services/payments-assistance-taxes/taxes/property-and-real-estate-taxes/get-real-estate-tax-relief/tax-freeze/apply-for-the-low-income-real-estate-tax-freeze/">
        Low-Income Tax Freeze</a>. Apply by January 31 and pay the same bill amount every year. Find more details at <a target="_blank" href="phila.gov/tax-freeze">phila.gov/tax-freeze</a>.
      </p> -->
      <p>
        The calculator below compares what your Real Estate Tax bill would be if you enroll in one of these programs for the
        {{ selectedTaxYear }} Assessment Year.  These estimates are for information only and may not reflect your bill if you are already
        enrolled in the program.  If you are currently enrolled, you never have to reapply unless your deed changes.  View your current
        tax bill at the <a target="_blank" href="https://tax-services.phila.gov/_/">Philadelphia Tax Center</a>.
        You must submit the necessary applications to receive tax assistance programs or exemptions.
      </p>
      <div
        class="tax-calc-container"
        id="tax-calculator"
        v-if="activeOpaData"
      >
        <div class="tax-calc-element">
          <label for="homestead_exemption">Select exemption</label>
          <select
            name="homestead_exemption"
            id="homestead_exemption"
            ref='homestead_exemption'
            v-model="selectedExemption"
          >
            <!-- <option value="current">Current bill</option> -->
            <option value="none">No exemption</option>
            <option value="homestead">Homestead Exemption</option>
            <option value="loop">Long-time Owner Occupant Program</option>
            <option value="lowIncome">Low-Income Tax Freeze</option>
            <option value="senior">Senior Citizen Tax Freeze</option>
          </select>
        </div>

        <div
          v-if="!seniorSelected"
          class="tax-calc-element"
        >
          <label for="estimated_tax">Estimated {{ selectedTaxYear }} Tax</label>

          <span
            v-if="!(lowIncomeSelected && selectedTaxYear == '2024')"
            id="estimate_total"
          > {{ taxableValue }} </span>

          <div v-else class="exception-note">The Low-Income Tax Freeze is not available for the {{ selectedTaxYear }} assessment year.</div>
        </div>

        <div
          v-if="loopSelected && loopEitherEligible"
          class="tax-calc-element"
        >
          <label for="estimated_tax">Assessment Cap</label>
          <span id="estimate_total"> {{ loopAssessmentCap }} </span>
        </div>

        <div
          v-if="seniorSelected"
          class="tax-calc-element"
        >
          <label for="homestead_exemption">Eligible year</label>
          <select
            name="homestead_exemption"
            id="homestead_exemption"
            ref='homestead_exemption'
            v-model="selectedSeniorYear"
          >
            <option
              v-for="year in seniorYears"
              :value="year"
            >
              {{ year }}
            </option>
          </select>
        </div>

        <div
          v-if="seniorSelected"
          class="tax-calc-element"
        >
          <label for="estimated_tax">Estimated {{ selectedTaxYear }} Tax</label>
          <span id="estimate_total"> {{ taxableValue }} </span>
        </div>

      </div>

      <div
        v-if="currentSelected || noneSelected || homesteadSelected"
        class="tax-calc-div"
      >
        <div
          v-if="hasHomestead"
          class="tax-calc-div"
        >
          <h4><b>This property has the Homestead Exemption</b></h4>
          <p>You never have to reapply for the Homestead Exemption unless your deed changes, such as when refinancing a mortgage or adding a co-owner.</p>
        </div>
        <div
          v-else
          class="tax-calc-div"
        >
          <h4><b>This property currently does not have a Homestead Exemption</b></h4>
          <p>If you qualify for the Homestead Exemption on your home,
            <a href="https://www.phila.gov/services/property-lots-housing/property-taxes/get-real-estate-tax-relief/get-the-homestead-exemption/" target="_blank">
            apply before December 1
            </a> of this year.
          </p>
        </div>
      </div>

      <div
        v-if="homesteadSelected"
        class="tax-calc-div"
      >
        <p>
          The <b>Homestead Exemption</b> reduces your property’s assessed value by up to $100,000, saving you up to $1,399 on your Real Estate Tax bill each year. To learn more
          about the program and how to apply, <a target="_blank" href="https://www.phila.gov/services/payments-assistance-taxes/payment-plans-and-assistance-programs/other-payment-plans-and-programs/get-the-homestead-exemption/">
          check the guidelines</a>. The deadline
          to apply for the Homestead Exemption for {{ selectedTaxYear }} is <b>December 1,
          {{ selectedTaxYear - 1 }}</b>. If you can, apply by <b>October 1</b> for early enrollment.
        </p>
      </div>

      <div
        v-if="loopSelected && !loopEitherEligible"
        class="tax-calc-div"
      >
        <h4><b>This property is not eligible to apply for LOOP for {{ selectedTaxYear }}</b></h4>
        <h5>Properties are only eligible for LOOP if the assessed value increased more than a certain amount compared to previous years</h5>
      </div>
      <div
        v-if="loopSelected && loopEitherEligible"
        class="tax-calc-div"
      >
        <h4><b>This property may be eligible to apply for LOOP for {{ selectedTaxYear }}</b></h4>
        <h5>Households must meet other eligibility requirements including income limits and have been living on the property for least ten years</h5>
      </div>

      <div
        v-if="loopSelected"
        class="tax-calc-div"
      >
        <p>
          The <b>Long-time Owner Occupant Program (LOOP)</b> caps your property's assessed value each year
          so that the amount of Real Estate Tax you owe will not increase as your property assessment changes
          for as long as you remain in the program. If the tax rate changes, or you are no longer eligible
          for the program, your tax payment may increase. To learn more about the program and how to apply,
          <a target="_blank" href="https://www.phila.gov/services/payments-assistance-taxes/payment-plans-and-assistance-programs/income-based-programs-for-residents/apply-for-the-longtime-owner-occupants-program-loop/">
          check the guidelines</a>. The deadline to apply for LOOP for {{ selectedTaxYear }} is
          <b>September 30, {{ selectedTaxYear }}</b>.
        </p>
      </div>

      <div
        v-if="lowIncomeSelected"
        class="tax-calc-div"
      >
        <h5>Households must meet other eligibility requirements including income limits and residency to qualify</h5>
        <p>
          The <b>Low-Income Tax Freeze</b> locks in your Real Estate Tax bill so you pay the same amount every year,
          even if your property assessment or the tax rate changes. If your tax liability decreases due to a
          lower property assessment or a tax rate decrease, we will update your benefit, lower your bill, and
          freeze it at the new amount. To learn more about the program and how to apply,
          <a target="_blank" href="https://www.phila.gov/services/payments-assistance-taxes/taxes/property-and-real-estate-taxes/get-real-estate-tax-relief/tax-freeze/apply-for-the-low-income-real-estate-tax-freeze/">
          check the guidelines</a>. The deadline to apply for the Low Income Tax Freeze
          for {{ selectedTaxYear }} is <b>January 31, {{ selectedTaxYear }}</b>.
        </p>
      </div>

      <div
        v-if="seniorSelected"
        class="tax-calc-div"
      >
        <h5>Households must meet other eligibility requirements including age, income limits, and residency to qualify</h5>
        <p>
          The <b>Senior Citizen Tax Freeze</b> locks in your Real Estate Tax bill so you pay the same amount
          every year, even if your property assessment or the tax rate changes. If
          you became eligible by age, income, and residency qualifications between 2018 and the current year, your
          bill will be frozen at the earliest year you meet all criteria. Use the drop down above to
          estimate your tax payment depending on which year you are eligible. To learn more about the
          program and how to apply, <a target="_blank" href="https://www.phila.gov/services/payments-assistance-taxes/payment-plans-and-assistance-programs/senior-citizen-programs/apply-for-the-low-income-senior-citizen-real-estate-tax-freeze/">
          check the guidelines</a>. The deadline to apply for the Senior
          Citizen Tax Freeze for {{ selectedTaxYear }} is <b>September 30, {{ selectedTaxYear }}</b>.
        </p>
      </div>
    </div>
  </div>
  <!-- End of 2023 Property Tax Calculator -->
</template>

<style>

.exception-note {
  font-weight: bold;
  max-width: 260px;
  padding: 0px !important;
  margin-left: 0px !important;
}

</style>