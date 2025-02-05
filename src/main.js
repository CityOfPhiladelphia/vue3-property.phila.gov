// turn off console logging in production
// const { hostname='' } = location;
// if (hostname !== 'localhost' && !hostname.match(/(\d+\.){3}\d+/)) {
//   console.log = console.info = console.debug = console.error = function () {};
// }

import { createApp } from 'vue';
import { createPinia } from 'pinia';
// import { createI18n } from 'vue-i18n'

import App from './App.vue';
import router from './router/index.js';

import isMac from './util/is-mac';

import 'vue-good-table-next/dist/vue-good-table-next.css'
import "bulma";
// import "../node_modules/bulma/bulma.sass";
// import "@fortawesome/fontawesome-pro/css/fontawesome.min.css";
// import "@fortawesome/fontawesome-pro/css/solid.min.css";
// import "@phila/phila-ui-core/dist/styles/scss/all.scss";
// import './assets/main.scss'
import './assets/style.scss'
if (isMac()) {
  import('./assets/mac-style.scss')
}

// import axios from 'axios';
// import createStore from './stores/MainStore.js';
// import mergeDeep from './util/merge-deep';
// import config from './config.js';

// import * as faAll from './fa.js';

// import configMixin from './util/config-mixin';
// import controllerMixin from '@phila/vue-datafetch/src/controller.js';
// const clientConfig = config;
// const baseConfigUrl = config.baseConfig;

// import '../node_modules/phila-standards/dist/css/phila-app.min.css';
// import helpers from './util/helpers';
// import 'phila-standards/dist/css/phila-app.min.css';
// import 'leaflet/dist/leaflet.css';
// import 'leaflet-easybutton/src/easy-button.css';
// import 'leaflet-measure/dist/leaflet-measure.css';
// import './styles.css';

const app = createApp(App);

import PhilaUICore from "@phila/phila-ui-core";
import AppHeader from "@phila/phila-ui-app-header";
import AppFooter from "@phila/phila-ui-app-footer";
import Dropdown from "@phila/phila-ui-dropdown";
import MobileNav from "@phila/phila-ui-mobile-nav";
import NavLink from "@phila/phila-ui-nav-link";
import Textbox from "@phila/phila-ui-textbox";
import LangSelector from "@phila/phila-ui-lang-selector";

app.component("AppHeader", AppHeader);
app.component("AppFooter", AppFooter);
app.component("Dropdown", Dropdown);
app.component("MobileNav", MobileNav);
app.component("NavLink", NavLink);
app.component("Textbox", Textbox);
app.component("LangSelector", LangSelector);
app.use(PhilaUICore);

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
app.component('FontAwesomeIcon', FontAwesomeIcon)

import VueGoodTablePlugin from 'vue-good-table-next';
app.use(VueGoodTablePlugin);

// import i18nFromFiles from './i18n/i18n.js';
// const messages = i18nFromFiles.i18n.data.messages;
// if (import.meta.env.VITE_DEBUG == 'true') console.log('i18nFromFiles:', i18nFromFiles, 'messages:', messages);
// const i18n = createI18n({
//   legacy: false,
//   locale: 'en-US',
//   fallbackLocale: 'en-US',
//   messages: messages
// })

// app.use(i18n)

app.use(createPinia())
app.use(router)

app.mount('#app')
