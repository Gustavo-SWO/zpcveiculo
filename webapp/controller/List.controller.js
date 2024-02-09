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
                var oModel = this.getOwnerComponent().getModel();

                this.getView().setModel(oModel);
            },
            onEliminarVeiculoButtonPress: function (oEvent) {

            },
            onRowActionItemPress: function (oEvent) {
                var oLine = oEvent.getSource().getBindingContext().getObject();

                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("details", { Vehicle: oLine.Vehicle });
            },
            onCriarVeiculoButtonPress: function (oEvent) {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("details");
            },
            onBeforeRebind: function (oEvent) {
                var mBindingParams = oEvent.getParameter("bindingParams");
                mBindingParams.parameters["expand"] = "VehicleText";
            },
        });
    });
