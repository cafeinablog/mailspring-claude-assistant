"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const improve_draft_button_1 = __importDefault(require("./improve-draft-button"));
const thread_summary_header_1 = __importDefault(require("./thread-summary-header"));
const composer_summary_footer_1 = __importDefault(require("./composer-summary-footer"));
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
    // Opción C: mismo recuadro dentro del compositor (comparte caché con A).
    mailspring_exports_1.ComponentRegistry.register(composer_summary_footer_1.default, {
        role: 'Composer:Footer',
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
    mailspring_exports_1.ComponentRegistry.unregister(composer_summary_footer_1.default);
    if (preferencesTab) {
        mailspring_exports_1.PreferencesUIStore.unregisterPreferencesTab(preferencesTab.tabId);
        preferencesTab = null;
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkRBQTJFO0FBRTNFLGtGQUF3RDtBQUN4RCxvRkFBMEQ7QUFDMUQsd0ZBQThEO0FBRTlELElBQUksY0FBYyxHQUFHLElBQUksQ0FBQztBQUUxQiw0RUFBNEU7QUFDNUUsZ0RBQWdEO0FBQ2hELEVBQUU7QUFDRixTQUFnQixRQUFRO0lBQ3RCLHFFQUFxRTtJQUNyRSxzQ0FBaUIsQ0FBQyxRQUFRLENBQUMsOEJBQWtCLEVBQUU7UUFDN0MsSUFBSSxFQUFFLHVCQUF1QjtLQUM5QixDQUFDLENBQUM7SUFDSCxxRUFBcUU7SUFDckUsNERBQTREO0lBQzVELHNDQUFpQixDQUFDLFFBQVEsQ0FBQywrQkFBbUIsRUFBRTtRQUM5QyxJQUFJLEVBQUUsb0JBQW9CO0tBQzNCLENBQUMsQ0FBQztJQUNILHlFQUF5RTtJQUN6RSxzQ0FBaUIsQ0FBQyxRQUFRLENBQUMsaUNBQXFCLEVBQUU7UUFDaEQsSUFBSSxFQUFFLGlCQUFpQjtLQUN4QixDQUFDLENBQUM7SUFDSCx3RUFBd0U7SUFDeEUsY0FBYyxHQUFHLElBQUksdUNBQWtCLENBQUMsT0FBTyxDQUFDO1FBQzlDLEtBQUssRUFBRSxRQUFRO1FBQ2YsV0FBVyxFQUFFLFFBQVE7UUFDckIsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUMsT0FBTztLQUNoRSxDQUFDLENBQUM7SUFDSCx1Q0FBa0IsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBckJELDRCQXFCQztBQUVELGtFQUFrRTtBQUNsRSx5RUFBeUU7QUFDekUsMkJBQTJCO0FBQzNCLEVBQUU7QUFDRixTQUFnQixTQUFTLEtBQUksQ0FBQztBQUE5Qiw4QkFBOEI7QUFFOUIsdUVBQXVFO0FBQ3ZFLHdFQUF3RTtBQUN4RSx3RUFBd0U7QUFDeEUsNENBQTRDO0FBQzVDLEVBQUU7QUFDRixTQUFnQixVQUFVO0lBQ3hCLHNDQUFpQixDQUFDLFVBQVUsQ0FBQyw4QkFBa0IsQ0FBQyxDQUFDO0lBQ2pELHNDQUFpQixDQUFDLFVBQVUsQ0FBQywrQkFBbUIsQ0FBQyxDQUFDO0lBQ2xELHNDQUFpQixDQUFDLFVBQVUsQ0FBQyxpQ0FBcUIsQ0FBQyxDQUFDO0lBQ3BELElBQUksY0FBYyxFQUFFO1FBQ2xCLHVDQUFrQixDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsRSxjQUFjLEdBQUcsSUFBSSxDQUFDO0tBQ3ZCO0FBQ0gsQ0FBQztBQVJELGdDQVFDIn0=