import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import App from '@motor/App.svelte';
import '@motor/estilos/tokens.css';
import '@motor/estilos/base.css';
import '@motor/estilos/tipografia.css';
// El tema visual opcional del temario solo cambia tokens de acento, nunca la maquetación.
const temasVisuales = import.meta.glob('@temario/tema.css', { eager: true });
void temasVisuales;

mount(App, { target: document.getElementById('app')! });

// Permite instalar el juego y usarlo sin conexión; se actualiza solo cuando hay una versión nueva.
registerSW({ immediate: true });
