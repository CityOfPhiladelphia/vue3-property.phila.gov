<script>

import { useMapStore} from '@/stores/MapStore.js';

// import controlMixin from "./controlMixin";
// import withEvents from "../../lib/withEvents";
// import withSelfEvents from "../withSelfEvents";

// import MapboxDraw from '@mapbox/mapbox-gl-draw';
// import mapbox-gl-draw-min.js, cloned from https://gist.github.com/godismyjudge95/a4ea43263db53b90b05511c911cd0034
// this was recommended by a comment in https://github.com/mapbox/mapbox-gl-js/issues/9114
// the official mapbox-gl-draw was blocking map clicks
// import MapboxDraw from '../../mapbox-gl-draw.min.js';
// import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
// import '../../maplibre-gl-draw.css';
// import area from '@turf/area';


export default {
  name: 'DrawControl',
  // mixins: [ withEvents, withSelfEvents, controlMixin ],
  props: [
    'control',
    'edit',
    'top',
    'left',
    'position',
    'barHeight',
    'barWidth',
    'barLineHeight',
    'buttonHeight',
    'buttonWidth',
    'buttonLineHeight',
    'isLarge',
  ],
  data() {
    const data = {
      draw: null,
      mode: 'simple_select',
      selected: null,
      toggledOn: false,
    };
    return data;
  },
  computed: {
    isLargeClass() {
      let value;
      if (isLarge) {
        value = 'is-large';
      } else {
        value = 'is-small';
      }
      return value;
    },
    drawToolActive() {
      return 'active mouse-add'
      // return this.$store.state.drawStart ? 'active mouse-add' : 'inactive pointer';
      // return this.$store.state.drawStart ? 'active pointer' : 'inactive pointer';
    },
    drawClassActive() {
      return 'leaflet-draw-actions'
      // return this.$store.state.drawStart ? 'leaflet-draw-actions' : 'leaflet-draw-actions tool-inactive';
    },
  },
  created() {
    const draw = this.$mapboxElement = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
      },
      styles: [
        {
          "id": "gl-draw-line",
          "type": "line",
          "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "simple_select"]],
          "layout": {
            "line-cap": "round",
            "line-join": "round"
          },
          "paint": {
            "line-color": "#D20C0C",
            "line-dasharray": [0.2, 2],
            "line-width": 2
          }
        },
        // polygon fill
        {
          "id": "gl-draw-polygon-fill",
          "type": "fill",
          "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "simple_select"]],
          "paint": {
            "fill-color": "#D20C0C",
            "fill-outline-color": "#D20C0C",
            "fill-opacity": 0.1
          }
        },
        // polygon mid points
        {
          'id': 'gl-draw-polygon-midpoint',
          'type': 'circle',
          'filter': ['all',
            ['==', '$type', 'Point'],
            ['==', 'meta', 'midpoint']],
          'paint': {
            'circle-radius': 3,
            'circle-color': '#fbb03b'
          },
        },
        // polygon outline stroke
        // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
        {
          "id": "gl-draw-polygon-stroke-active",
          "type": "line",
          "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "simple_select"]],
          "layout": {
            "line-cap": "round",
            "line-join": "round"
          },
          "paint": {
            "line-color": "#D20C0C",
            "line-dasharray": [0.2, 2],
            "line-width": 2
          }
        },
        // vertex point halos
        {
          "id": "gl-draw-polygon-and-line-vertex-halo-active",
          "type": "circle",
          "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "simple_select"]],
          "paint": {
            "circle-radius": 5,
            "circle-color": "#FFF"
          }
        },
        // vertex points
        {
          "id": "gl-draw-polygon-and-line-vertex-active",
          "type": "circle",
          "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "simple_select"]],
          "paint": {
            "circle-radius": 3,
            "circle-color": "#D20C0C",
          }
        },

        // INACTIVE (simple_select, already drawn)
        // line stroke
        {
            "id": "gl-draw-line-static",
            "type": "line",
            "filter": ["all", ["==", "$type", "LineString"], ["==", "mode", "simple_select"]],
            "layout": {
              "line-cap": "round",
              "line-join": "round"
            },
            "paint": {
              "line-color": "#000",
              "line-width": 3
            }
        },
        // polygon fill
        {
          "id": "gl-draw-polygon-fill-static",
          "type": "fill",
          "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "simple_select"]],
          "paint": {
            "fill-color": "#000",
            "fill-outline-color": "#000",
            "fill-opacity": 0.1
          }
        },
        // polygon outline
        {
          "id": "gl-draw-polygon-stroke-static",
          "type": "line",
          "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "simple_select"]],
          "layout": {
            "line-cap": "round",
            "line-join": "round"
          },
          "paint": {
            "line-color": "#000",
            "line-width": 3
          }
        }
      ]
    });

    // MapStore.draw = draw;
    // this.$store.commit('setDraw', draw);
    // let map = this.$store.map;

    // map.addControl(draw, this.$props.position);

    // let element = document.getElementsByClassName('mapbox-gl-draw_polygon')[0];
    // element.innerHTML='draw tool';
    // console.log('DistanceMeasureControl.vue mounted, element:', element);

    // map.on('draw.create', e => this.$emit('drawCreate', e));
    // map.on('draw.update', e => this.$emit('drawUpdate', e));
    // map.on('draw.actionable', e => this.$emit('drawActionable', e));

    let $this = this;
    // map.on('draw.delete', function(e) {
    //   console.log('map.on draw.delete is running');
    //   $this.selected = null;
    //   $this.$emit('drawDelete', e);
    // });

    // map.on('draw.selectionchange', function(e){
    //   // console.log('draw.selectionchange, e:', e, 'e.features[0]:', e.features[0]);
    //   if (e.features[0]) {
    //     $this.$data.selected = e.features[0].id;
    //   } else {
    //     $this.$data.selected = null;
    //   }
    //   $this.$emit('drawSelectionChange', e);
    // });

    // map.on('draw.modechange', function(e){
    //   console.log('draw.modechange, e:', e);
    //   if (e.mode !== 'simple_select') {
    //     $this.$data.toggledOn = true;
    //   }
    //   $this.$data.mode = e.mode;
    //   $this.$emit('drawModeChange', e);
    // });

    // map.on('draw.create', this.drawShapeChange);

    // let state = this.$store.state;
  },
  methods: {
    handleFinishButtonClick(e) {
      const MapStore = useMapStore();
      console.log('finishButtonClick is running, e:', e);
      this.$emit('drawFinish', e);
      MapStore.draw.changeMode('simple_select');
    },
    handleDeletePointButtonClick() {
      console.log('deletePointButtonClick');
    },
    handleCancelButtonClick() {
      const MapStore = useMapStore();
      // console.log('cancelButtonClick');
      MapStore.draw.trash();
      MapStore.draw.changeMode('simple_select');
      MapStore.setDrawStart(false);
    },
    handleDrawButtonClick(e) {
      const MapStore = useMapStore();
      console.log('DrawControl.vue handleDrawButtonClick');
      // MapStore.setDrawStart(true);
      MapStore.draw.changeMode('draw_polygon');
      console.log('DrawControl.vue handleDrawButtonClick still running');
      this.$emit('drawModeChange', {mode: 'draw_polygon'});
    },
    // drawShapeChange(shape) {
    //   console.log('MbDrawControl, drawShapeChange, shape:', shape);
    //   // this.$store.commit('setDrawShape', shape.layer);
    //   // this.$store.commit('setShapeSearchInput', shape.layer._latlngs[0]);
    //   // setShapeSearchInput is in @phila/vue-datafetch store.js
    //   // this.$store.commit('setShapeSearchInput', shape.features[0].geometry.coordinates[0]);
    // },
  },
};
</script>

<template>
  <div
    title="Search by Drawing"
    :class="'measure-tool-popup-top-left'"
    :style="{ 'height': buttonHeight, 'width': '240px', 'line-height': buttonLineHeight }"
    @click="handleDrawButtonClick"
  >
    <button
      v-if="isLarge"
      :class="drawToolActive"
      :style="{ 'height': buttonHeight, 'width': '240px', 'line-height': buttonLineHeight }"
      @click="handleDrawButtonClick"
    >
    <!-- :style="{ 'height': buttonHeight, 'width': buttonWidth, 'line-height': buttonLineHeight }" -->
      <span class="button-state state-unnamed-state unnamed-state-active">
        <font-awesome-icon
          :icon="'hexagon'"
          class="fa-3x icon-padding"
        />
      </span>
      <span class="button-text">
        DRAW BOUNDARIES
      </span>
    </button>
    <button
      v-if="!isLarge"
      @click="handleDrawButtonClick"
      class="small-button"
    >
      <font-awesome-icon
        :icon="'hexagon'"
        class="fa-3x"
      />
    </button>
    <div :class="drawClassActive">
      <ul>
        <li class="finish-button">
          <a @click="handleFinishButtonClick">Finish</a>
        </li>
        <!-- <li class="delete-point-button">
          <a @click="handleDeletePointButtonClick">Delete last point</a>
        </li> -->
        <li class="cancel-button">
          <a @click="handleCancelButtonClick">Cancel</a>
        </li>
      </ul>
    </div>
  </div>

</template>

<style>

.measure-tool-popup-top-left {
  background-color: #0f4d90 !important;
  font-family: Montserrat, sans-serif;
  font-size: 12px;
  position: absolute;
  width: 300px;
  min-width: 200px;
  top: 40px;
  left: 6px;
  padding: 10px;
  color: #fff;
  margin-bottom: 24px;
  margin-right: 50px;
  /* border-radius: 10px; */
  z-index: 12;
}

.measure-tool-popup-bottom-left {
  font-family: Montserrat, sans-serif;
  font-size: 12px;
  position: absolute;
  width: 300px;
  min-width: 200px;
  bottom: 0;
  left: 0;
  padding: 10px;
  background-color: #fff;
  margin-bottom: 24px;
  margin-left: 50px;
  border-radius: 10px;
  z-index: 12;
}

.measure-tool-header {
  font-size: 14px;
}

.measure-tool-description {
  font-size: 10px;
}

table {
  margin-top: 0px;
  margin-bottom: 0px;
}

.distance-table {
  width: 100%;
  border-collapse: collapse;

  th {
    background-color: rgb(68, 68, 68);
    color: white;
  }

  td {
    margin-right: 5px !important;

  }

  th, td {
    text-align: center !important;
  }
}

td {
  text-align: center;
}

tr:nth-child(even) {
  background-color: #f2f2f2;
}

.img-class {
  margin: 2px;
  cursor: pointer;
}

.inline-block-div {
  display: inline-block;
  margin: 2px;
  margin-right: 8px;
  cursor: pointer;
}

.popup-line {
  margin-top: 4px;
  margin-bottom: 4px;
}

.mapbox-gl-draw_polygon {
  background-image: url('@/assets/images/rulers.png') !important;
  text-indent: 100%;
  white-space: nowrap;
  overflow: hidden;
}

.mapbox-gl-draw_ctrl-draw-btn {
  background-size: 55% !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-color: white !important;
  border-radius: 5px !important;
  border: 2px solid rgb(167, 166, 166) !important;
  position: absolute;
  height: 36px !important;
  width: 36px !important;
  right: 10px;
  bottom: 10px;
}







.leaflet-bar a:hover {
  background-color: rgb(211, 211, 211);
}

.is-large {
  top: 94px;
  left: 30px;
  height: 45px;
  /* width: 180px; */
}
/* line-height: barLineHeight; */

.small-button {
  height: 32px !important;
  width: 32px !important;
  padding-top: 5px;
  /* padding-left: 4px; */
}

.is-small {
  top: 154px;
  right: 30px;
  padding: 0px;
  margin-top: 10px;
  margin-right: 10px;
  margin-left: 0px;
  border: solid;
  border-width: 2px;
  border-color: #a1a1a1;
  border-radius: 4px;
  background-color: white;
  font-family: arial;
  font-weight: bold;
  color: black;
  width: 36px;
  height: 36px;
  line-height: 30px;
  pointer-events: auto;
  cursor: pointer;
  box-shadow: 0 0 0;
}

.mapbox-gl-draw_ctrl-draw-btn {
  display: none !important;
}

.mapboxgl-ctrl-group, mapboxgl-ctrl-group:not(:empty) {
  /* display: none; */
  /* width: 210px;
  height: 50px;
  background-color: #0f4d90;
  border-radius: 0px;
  border-width: 0px;
  box-shadow: 0 0 0 0px !important; */
}

.mapboxgl-ctrl-group button {
  /* display: none; */
  /* width: 100%;
  height: 100%; */
}

.mapboxgl-ctrl-top-left, .maplibregl-ctrl-top-left {
  /* display: none; */
  /* top: 130px;
  left: 20px; */
}

.icon-padding {
  padding-top: 8px;
  padding-bottom: 6px;
  color: #4f4f4f;
}

.button-text {
  font-weight: normal;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 0px;
  padding-right: 10px;
  color: white;
  align-items: center;
}

.active .button-text {
  color: #0f4d90;
}

@media screen and (max-width: 750px) {
  .fa-3x {
    font-size: 1.5em;
  }

  .icon-padding {
    padding-top: 0px;
    color: #4f4f4f;
    left: 4px;
    top: 4px;
    position: absolute;
  }
}

.inactive {
  background-color: #ffffff;
}
.inactive:hover {
  background-color: #ffffff;
}
.active {
  background-color: rgb(243, 198, 19);
}
.active:hover {
  background-color: rgb(243, 198, 19);
}

.leaflet-draw-actions {
  /* width: 217px; */
  width: 110px;
  background-color: #919187;
  color: #FFF;
  display: block;
  top: -1px;
  left: 138px;
  position: absolute;
  font: 11px/19px "Helvetica Neue", Arial, Helvetica, sans-serif;
  font-size: 12px;
  border-radius: 0 4px 4px 0;
}

.leaflet-draw-actions li {
  display: inline-block;
  border-left: 1px solid #AAA;
  padding: 0 5px 0 5px;
  height: 30px;
}

.leaflet-draw-actions ul {
  line-height: 2.5;
  margin-left: 0px;
}

.leaflet-draw-actions li:first-child {
  border-left: none;
}

.leaflet-bar a,
.leaflet-bar a:hover {
  width: 100%;
}

.finish-button {
  width: 50px;
}

.delete-point-button {
  width: 110px;
}

.cancel-button {
  width: 50px;
}

.tool-inactive {
  display: none;
}

.leaflet-draw-actions a {
  /* padding-left: 5px; */
  /* width: 100%; */
  /* color: #FFF; */
  font: "Helvetica Neue", Arial, Helvetica, sans-serif;
  font-size: 12px;
  /* background-color: #919187; */
}

.pointer {
  cursor: pointer;
}

</style>
