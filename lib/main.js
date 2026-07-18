"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const improve_draft_button_1 = __importDefault(require("./improve-draft-button"));
const thread_summary_header_1 = __importDefault(require("./thread-summary-header"));
let preferencesTab = null;
// Activate is called when the package is loaded. If your package previously
// saved state using `serialize` it is provided.
//
function activate() {
    // Botón "Mejorar con Claude" en la barra de acciones del compositor.
    mailspring_exports_1.ComponentRegistry.register(improve_draft_button_1.default, {
        role: 'Composer:ActionButton',
    });
    // Opción A: recuadro de resumen en la cabecera del hilo (rol nativo,
    // reemplaza a la antigua tarjeta del sidebar de contactos).
    mailspring_exports_1.ComponentRegistry.register(thread_summary_header_1.default, {
        role: 'MessageListHeaders',
    });
    // DEV-11: pestaña "Claude" en Preferencias (patrón composer-templates).
    preferencesTab = new mailspring_exports_1.PreferencesUIStore.TabItem({
        tabId: 'Claude',
        displayName: 'Claude',
        componentClassFn: () => require('./preferences-claude').default,
    });
    mailspring_exports_1.PreferencesUIStore.registerPreferencesTab(preferencesTab);
}
exports.activate = activate;
// Serialize is called when your package is about to be unmounted.
// You can return a state object that will be passed back to your package
// when it is re-activated.
//
function serialize() { }
exports.serialize = serialize;
// This **optional** method is called when the window is shutting down,
// or when your package is being updated or disabled. If your package is
// watching any files, holding external resources, providing commands or
// subscribing to events, release them here.
//
function deactivate() {
    mailspring_exports_1.ComponentRegistry.unregister(improve_draft_button_1.default);
    mailspring_exports_1.ComponentRegistry.unregister(thread_summary_header_1.default);
    if (preferencesTab) {
        mailspring_exports_1.PreferencesUIStore.unregisterPreferencesTab(preferencesTab.tabId);
        preferencesTab = null;
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkRBQTJFO0FBRTNFLGtGQUF3RDtBQUN4RCxvRkFBMEQ7QUFFMUQsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBRTFCLDRFQUE0RTtBQUM1RSxnREFBZ0Q7QUFDaEQsRUFBRTtBQUNGLFNBQWdCLFFBQVE7SUFDdEIscUVBQXFFO0lBQ3JFLHNDQUFpQixDQUFDLFFBQVEsQ0FBQyw4QkFBa0IsRUFBRTtRQUM3QyxJQUFJLEVBQUUsdUJBQXVCO0tBQzlCLENBQUMsQ0FBQztJQUNILHFFQUFxRTtJQUNyRSw0REFBNEQ7SUFDNUQsc0NBQWlCLENBQUMsUUFBUSxDQUFDLCtCQUFtQixFQUFFO1FBQzlDLElBQUksRUFBRSxvQkFBb0I7S0FDM0IsQ0FBQyxDQUFDO0lBQ0gsd0VBQXdFO0lBQ3hFLGNBQWMsR0FBRyxJQUFJLHVDQUFrQixDQUFDLE9BQU8sQ0FBQztRQUM5QyxLQUFLLEVBQUUsUUFBUTtRQUNmLFdBQVcsRUFBRSxRQUFRO1FBQ3JCLGdCQUFnQixFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLE9BQU87S0FDaEUsQ0FBQyxDQUFDO0lBQ0gsdUNBQWtCLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQWpCRCw0QkFpQkM7QUFFRCxrRUFBa0U7QUFDbEUseUVBQXlFO0FBQ3pFLDJCQUEyQjtBQUMzQixFQUFFO0FBQ0YsU0FBZ0IsU0FBUyxLQUFJLENBQUM7QUFBOUIsOEJBQThCO0FBRTlCLHVFQUF1RTtBQUN2RSx3RUFBd0U7QUFDeEUsd0VBQXdFO0FBQ3hFLDRDQUE0QztBQUM1QyxFQUFFO0FBQ0YsU0FBZ0IsVUFBVTtJQUN4QixzQ0FBaUIsQ0FBQyxVQUFVLENBQUMsOEJBQWtCLENBQUMsQ0FBQztJQUNqRCxzQ0FBaUIsQ0FBQyxVQUFVLENBQUMsK0JBQW1CLENBQUMsQ0FBQztJQUNsRCxJQUFJLGNBQWMsRUFBRTtRQUNsQix1Q0FBa0IsQ0FBQyx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEUsY0FBYyxHQUFHLElBQUksQ0FBQztLQUN2QjtBQUNILENBQUM7QUFQRCxnQ0FPQyJ9