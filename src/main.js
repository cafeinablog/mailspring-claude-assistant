import { ComponentRegistry, PreferencesUIStore } from 'mailspring-exports';

import ImproveDraftButton from './improve-draft-button';
import ThreadSummaryHeader from './thread-summary-header';

let preferencesTab = null;

// Activate is called when the package is loaded. If your package previously
// saved state using `serialize` it is provided.
//
export function activate() {
  // Botón "Mejorar con Claude" en la barra de acciones del compositor.
  ComponentRegistry.register(ImproveDraftButton, {
    role: 'Composer:ActionButton',
  });
  // Opción A: recuadro de resumen en la cabecera del hilo (rol nativo,
  // reemplaza a la antigua tarjeta del sidebar de contactos).
  ComponentRegistry.register(ThreadSummaryHeader, {
    role: 'MessageListHeaders',
  });
  // DEV-11: pestaña "Claude" en Preferencias (patrón composer-templates).
  preferencesTab = new PreferencesUIStore.TabItem({
    tabId: 'Claude',
    displayName: 'Claude',
    componentClassFn: () => require('./preferences-claude').default,
  });
  PreferencesUIStore.registerPreferencesTab(preferencesTab);
}

// Serialize is called when your package is about to be unmounted.
// You can return a state object that will be passed back to your package
// when it is re-activated.
//
export function serialize() {}

// This **optional** method is called when the window is shutting down,
// or when your package is being updated or disabled. If your package is
// watching any files, holding external resources, providing commands or
// subscribing to events, release them here.
//
export function deactivate() {
  ComponentRegistry.unregister(ImproveDraftButton);
  ComponentRegistry.unregister(ThreadSummaryHeader);
  if (preferencesTab) {
    PreferencesUIStore.unregisterPreferencesTab(preferencesTab.tabId);
    preferencesTab = null;
  }
}
