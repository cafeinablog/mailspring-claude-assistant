import { ComponentRegistry } from 'mailspring-exports';

import MyComposerButton from './my-composer-button';
import ThreadSummarySidebar from './thread-summary-sidebar';

// Activate is called when the package is loaded. If your package previously
// saved state using `serialize` it is provided.
//
export function activate() {
  // Botón de ejemplo del compositor — será reemplazado por "Mejorar
  // respuesta" en DEV-07.
  ComponentRegistry.register(MyComposerButton, {
    role: 'Composer:ActionButton',
  });
  // Tarjeta "Claude" con el botón "Resumir hilo" en el sidebar del hilo.
  ComponentRegistry.register(ThreadSummarySidebar, {
    role: 'MessageListSidebar:ContactCard',
  });
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
  ComponentRegistry.unregister(MyComposerButton);
  ComponentRegistry.unregister(ThreadSummarySidebar);
}
