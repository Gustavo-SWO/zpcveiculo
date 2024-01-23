sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("zpcveiculo.controller.List", {
            onInit: function () {

            },
            onCriarVeiculoButtonPress: function (oEvent) {
    
            },
            onEliminarVeiculoButtonPress: function (oEvent) {
    
            },
            onRowActionItemPress: function (oEvent) {
                var oLine = oEvent.getSource().getBindingContext().getObject();
    
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("details", { TuNumber: oLine.TuNumber });
            },
            onCriarVeiculoButtonPress: function (oEvent) {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("details");
            }
        });
    });
