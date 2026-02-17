import { createApp } from 'vue';
import App from './App.vue';
import Imprimir from './Imprimir.vue';
import '../assets/index.css';

const pathname = window.location.pathname || '';

if (pathname.toLowerCase().includes('imprimir')) {
  createApp(Imprimir).mount('#app');
} else {
  createApp(App).mount('#app');
}
