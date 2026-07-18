"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const my_composer_button_1 = __importDefault(require("./my-composer-button"));
const thread_summary_sidebar_1 = __importDefault(require("./thread-summary-sidebar"));
// Activate is called when the package is loaded. If your package previously
// saved state using `serialize` it is provided.
//
function activate() {
    // Botón de ejemplo del compositor — será reemplazado por "Mejorar
    // respuesta" en DEV-07.
    mailspring_exports_1.ComponentRegistry.register(my_composer_button_1.default, {
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
    mailspring_exports_1.ComponentRegistry.unregister(my_composer_button_1.default);
    mailspring_exports_1.ComponentRegistry.unregister(thread_summary_sidebar_1.default);
}
exports.deactivate = deactivate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkRBQXVEO0FBRXZELDhFQUFvRDtBQUNwRCxzRkFBNEQ7QUFFNUQsNEVBQTRFO0FBQzVFLGdEQUFnRDtBQUNoRCxFQUFFO0FBQ0YsU0FBZ0IsUUFBUTtJQUN0QixrRUFBa0U7SUFDbEUsd0JBQXdCO0lBQ3hCLHNDQUFpQixDQUFDLFFBQVEsQ0FBQyw0QkFBZ0IsRUFBRTtRQUMzQyxJQUFJLEVBQUUsdUJBQXVCO0tBQzlCLENBQUMsQ0FBQztJQUNILHVFQUF1RTtJQUN2RSxzQ0FBaUIsQ0FBQyxRQUFRLENBQUMsZ0NBQW9CLEVBQUU7UUFDL0MsSUFBSSxFQUFFLGdDQUFnQztLQUN2QyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBVkQsNEJBVUM7QUFFRCxrRUFBa0U7QUFDbEUseUVBQXlFO0FBQ3pFLDJCQUEyQjtBQUMzQixFQUFFO0FBQ0YsU0FBZ0IsU0FBUyxLQUFJLENBQUM7QUFBOUIsOEJBQThCO0FBRTlCLHVFQUF1RTtBQUN2RSx3RUFBd0U7QUFDeEUsd0VBQXdFO0FBQ3hFLDRDQUE0QztBQUM1QyxFQUFFO0FBQ0YsU0FBZ0IsVUFBVTtJQUN4QixzQ0FBaUIsQ0FBQyxVQUFVLENBQUMsNEJBQWdCLENBQUMsQ0FBQztJQUMvQyxzQ0FBaUIsQ0FBQyxVQUFVLENBQUMsZ0NBQW9CLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBSEQsZ0NBR0MifQ==