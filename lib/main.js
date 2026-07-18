"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const improve_draft_button_1 = __importDefault(require("./improve-draft-button"));
const thread_summary_sidebar_1 = __importDefault(require("./thread-summary-sidebar"));
// Activate is called when the package is loaded. If your package previously
// saved state using `serialize` it is provided.
//
function activate() {
    // Botón "Mejorar con Claude" en la barra de acciones del compositor.
    mailspring_exports_1.ComponentRegistry.register(improve_draft_button_1.default, {
        role: 'Composer:ActionButton',
    });
    // Tarjeta "Claude" con el botón "Resumir hilo" en el sidebar del hilo.
    mailspring_exports_1.ComponentRegistry.register(thread_summary_sidebar_1.default, {
        role: 'MessageListSidebar:ContactCard',
    });
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
    mailspring_exports_1.ComponentRegistry.unregister(thread_summary_sidebar_1.default);
}
exports.deactivate = deactivate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkRBQXVEO0FBRXZELGtGQUF3RDtBQUN4RCxzRkFBNEQ7QUFFNUQsNEVBQTRFO0FBQzVFLGdEQUFnRDtBQUNoRCxFQUFFO0FBQ0YsU0FBZ0IsUUFBUTtJQUN0QixxRUFBcUU7SUFDckUsc0NBQWlCLENBQUMsUUFBUSxDQUFDLDhCQUFrQixFQUFFO1FBQzdDLElBQUksRUFBRSx1QkFBdUI7S0FDOUIsQ0FBQyxDQUFDO0lBQ0gsdUVBQXVFO0lBQ3ZFLHNDQUFpQixDQUFDLFFBQVEsQ0FBQyxnQ0FBb0IsRUFBRTtRQUMvQyxJQUFJLEVBQUUsZ0NBQWdDO0tBQ3ZDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFURCw0QkFTQztBQUVELGtFQUFrRTtBQUNsRSx5RUFBeUU7QUFDekUsMkJBQTJCO0FBQzNCLEVBQUU7QUFDRixTQUFnQixTQUFTLEtBQUksQ0FBQztBQUE5Qiw4QkFBOEI7QUFFOUIsdUVBQXVFO0FBQ3ZFLHdFQUF3RTtBQUN4RSx3RUFBd0U7QUFDeEUsNENBQTRDO0FBQzVDLEVBQUU7QUFDRixTQUFnQixVQUFVO0lBQ3hCLHNDQUFpQixDQUFDLFVBQVUsQ0FBQyw4QkFBa0IsQ0FBQyxDQUFDO0lBQ2pELHNDQUFpQixDQUFDLFVBQVUsQ0FBQyxnQ0FBb0IsQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFIRCxnQ0FHQyJ9