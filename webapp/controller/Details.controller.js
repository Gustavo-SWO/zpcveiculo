sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    'sap/m/BusyDialog',
    'sap/m/MessageBox'
], function (
    Controller,
    History,
    BusyDialog,
    MessageBox
) {
    "use strict";

    const cModeInsert = "I";
    const cModeUpdate = "U";
    const cModeDisplay = "V";

    return Controller.extend("zpcveiculo.controller.Details", {
        _key: "",
        _mode: cModeDisplay,
        onInit: function () {
            sap.ui.core.UIComponent.getRouterFor(this).getRoute("details").attachPatternMatched(this.onRouteMatched, this);

            var oModel = this.getOwnerComponent().getModel();
            oModel.setDefaultBindingMode("TwoWay");

            this.getView().setModel(oModel);

            this.getView().setModel(new sap.ui.model.json.JSONModel({
                key: this._key,
                mode: this._mode
            }, true), "viewData");

            this.getView().setModel(new sap.ui.model.json.JSONModel([]), "tableAtribTUData");
        },
        onRouteMatched: function (oEvent) {
            var args = oEvent.getParameter("arguments");

            this._setKey(args["Vehicle"]);

            if (this._key) {
                this._setMode(cModeDisplay);
                this.getView().byId("idVehicleGroupElement").setVisible(false);
                this._loadData(this._key);
            } else {
                this._setMode(cModeInsert);
                this._switchFormCreate();
                var oModel = this.getView().getModel();
                // oModel.attachMetadataLoaded(function () {
                // var oContextChild = oModel.createEntry("/VeiculoTextSet", {
                //     success: function (params) {

                //     },
                //     error: function (params) {

                //     }
                // });
                var oContext = oModel.createEntry("/VeiculoSet", {
                    success: function (params) {

                    },
                    error: function (params) {

                    }
                });

                this.getView().setBindingContext(oContext);

                this.getView().byId("idSmartForm").bindElement(oContext.getPath());

                // });
            }
        },
        onSmartFormEditToggled: function () {
            var oElement = this.byId("idGravarButton");

            if (oElement.getVisible()) {
                this._setMode(cModeDisplay);
                oElement.setVisible(false);
                this.getView().byId("idSmartForm").setTitle("Exibir Veículo " + this._key);
            } else {
                oElement.setVisible(true);

                if (!this._key) {
                    this._setMode(cModeInsert);
                    this.getView().byId("idSmartForm").setTitle("Criar Veículo");
                } else {
                    this._setMode(cModeUpdate);
                    this.getView().byId("idSmartForm").setTitle("Modif. Veículo " + this._key);
                }
            }
        },
        navBack: function () {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteList", {}, true);
            }
        },
        onButtonAddRowPress: function (oEvent) {

        },
        _setKey: function (sKey) {
            this._key = sKey;
            let oModel = this.getView().getModel("viewData");
            oModel.setProperty("/key", this._mode);
        },
        _setMode: function (sMode) {
            this._mode = sMode;
            let oModel = this.getView().getModel("viewData");
            oModel.setProperty("/mode", this._mode);
        },
        _loadData: function (vehicle) {
            var that = this;
            var oDataModel = this.getOwnerComponent().getModel();

            this.getView().byId("idSmartForm").setTitle("Exibir Veículo " + this._key);

            this.getView().getModel().getMetaModel().loaded().then(function () {
                that.getView().byId("idSmartForm").bindElement("/VeiculoSet('" + that._key + "')");
            });
            // var oFilter = new Filter("('" + x + "')");

            try {
                oDataModel.read("/VeiculoSet('" + vehicle + "')", {
                    urlParameters: {
                        "$expand": "VeiculoText,VeiculoAtribUnidTransp"
                    },
                    filters: [],
                    success: function (oData, response) {
                        that.getView().byId("idSmartForm").bindElement("/VeiculoSet('" + vehicle + "')");

                        let oModelVeiculoAtribUnidTransp = that.getView().getModel("tableAtribTUData");

                        let aResults = oData.VeiculoAtribUnidTransp.results;

                        for (let i = 0; i < aResults.length; i++) {
                            delete aResults[i]._metadata;
                        }

                        oModelVeiculoAtribUnidTransp.setData(aResults);

                        // let oTable = that.getView().byId("idVeiculoAtribUnidTranspTable");
                        // oTable.setModel(oModelVeiculoAtribUnidTransp);

                        // oTable.bindAggregation("items", {
                        //     path: "/d/results",
                        //     template: oTable.getBindingInfo("items").template
                        // });
                    },
                    error: function (e) {
                        if (e.responseText) {
                            var responseObj = JSON.parse(e.responseText);
                            MessageBox.error(responseObj.error.message.value);
                        }
                    }
                });
            } catch (e) {
                MessageBox.error(e);
            }
        },
        onGravarButtonPress: function (oEvent) {
            if (this._mode === cModeInsert) {
                this._saveCreate();
            } else {
                this._saveUpdate();
            }
        },
        _switchFormCreate: function () {
            var oSmartForm = this.getView().byId("idSmartForm");

            if (this._mode === cModeInsert && !oSmartForm.getEditable()) {
                //Create mode
                this.getView().byId("idVehicleGroupElement").setVisible(true);
                oSmartForm._toggleEditMode();
                oSmartForm.setEditTogglable(false);
            }
        },
        _saveCreate: function () {
            var that = this;
            var oDataModel = this.getOwnerComponent().getModel();
            var sEntityPath = this.getView().byId("idSmartForm").getBindingContext().getPath();
            var oData = oDataModel.getData(sEntityPath);
            let oSendData = { ...oData };
            oSendData.VeiculoText = { ...oDataModel.getData(sEntityPath + "/VeiculoText") };

            try {
                // oDataModel.submitChanges({
                oDataModel.create("/VeiculoSet", oSendData, {
                    success: function (oData, response) {
                        MessageBox.success("Dados gravados com sucesso!", {
                            onClose: function () {
                                // var oSmartForm = that.getView().byId("idSmartForm");
                                // oSmartForm._toggleEditMode();
                                that.navBack();
                            }
                        });
                    },
                    error: that._saveError
                });
            } catch (e) {
                MessageBox.error(e);
            }
        },
        _saveUpdate: function () {
            var that = this;
            var oDataModel = this.getOwnerComponent().getModel();
            var sEntityPath = "/VeiculoSet('" + this._key + "')";
            // var sEntityPath = this.getView().byId("idSmartForm").getBindingContext().getPath();
            var oData = oDataModel.getData(sEntityPath);

            let oSendData = { ...oData };
            oSendData.VeiculoText = { ...oDataModel.getData(sEntityPath + "/VeiculoText") };

            try {
                oDataModel.create("/VeiculoSet", oSendData, {
                    success: function (oData, response) {
                        MessageBox.success("Dados gravados com sucesso!", {
                            onClose: function () {
                                var oSmartForm = that.getView().byId("idSmartForm");
                                oSmartForm._toggleEditMode();
                            }
                        });
                    },
                    error: that._saveError
                });
            } catch (e) {
                MessageBox.error(e);
            }
        },
        _saveError: function (e) {
            MessageBox.error("Erro ao gravar dados");
            // if (e.responseText) {
            //     var responseObj = JSON.parse(e.responseText);
            //     MessageBox.error(responseObj.error.message);
            // }
        }
        // callCreate: function () {
        //     var that = this;
        //     var oDataModel = this.getOwnerComponent().getModel();
        //     // var sEntityPath = "/VeiculoSet";
        //     // var oData = oDataModel.getData(sEntityPath);

        //     try {
        //         // oDataModel.create(sEntityPath, oData, {
        //         oDataModel.submitChanges({
        //             success: function (oData, response) {
        //                 MessageBox.success("Dados gravados com sucesso!", {
        //                     onClose: function () {
        //                         var oSmartForm = that.getView().byId("idSmartForm");
        //                         oSmartForm._toggleEditMode();
        //                     }
        //                 });
        //             },
        //             error: function (e) {
        //                 if (e.responseText) {
        //                     var responseObj = JSON.parse(e.responseText);
        //                     MessageBox.error(responseObj.error.message);
        //                 }
        //             }
        //         });
        //     } catch (e) {
        //         MessageBox.error(e);
        //     }
        // },
        // callUpdate: function () {
        //     var that = this;
        //     var oDataModel = this.getOwnerComponent().getModel();
        //     var sEntityPath = "/VeiculoSet('" + this._key + "')";
        //     var oData = oDataModel.getData(sEntityPath);

        //     let oSendData = { ...oData };
        //     oSendData.VeiculoText = { ...oDataModel.getData(sEntityPath + "/VeiculoText") };

        //     try {
        //         oDataModel.update(sEntityPath, oData, {
        //             success: function (oData, response) {
        //                 MessageBox.success("Dados gravados com sucesso!", {
        //                     onClose: function () {
        //                         var oSmartForm = that.getView().byId("idSmartForm");
        //                         oSmartForm._toggleEditMode();
        //                     }
        //                 });
        //             },
        //             error: function (e) {
        //                 if (e.responseText) {
        //                     var responseObj = JSON.parse(e.responseText);
        //                     MessageBox.error(responseObj.error.message);
        //                 }
        //             }
        //         });
        //     } catch (e) {
        //         MessageBox.error(e);
        //     }
        // }
    });
});