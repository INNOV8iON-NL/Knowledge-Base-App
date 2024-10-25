sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/UIComponent'
],
function (Controller, UIComponent) {
    "use strict";

    return Controller.extend("articlesfreestyle.controller.NotFound", {
     getRouter: function(){
        return sap.ui.core.UIComponent.getRouterFor(this);
     },

    });
});
