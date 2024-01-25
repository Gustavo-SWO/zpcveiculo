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

    var vm = null;

    return Controller.extend("zpcveiculo.controller.Details", {
        _key: "",
        _mode: cModeDisplay,
        _templateVeiculoAtribUnidTransp: {
            Vehicle: null,
            TuNumber: null,
            SeqNmbr: null,
            TuText: null,
            mode: cModeInsert
        },
        onInit: function () {
            vm = this;

            sap.ui.core.UIComponent.getRouterFor(this).getRoute("details").attachPatternMatched(this._onRouteMatched, this);

            var oModel = this.getOwnerComponent().getModel();
            oModel.setDefaultBindingMode("TwoWay");

            this.getView().setModel(oModel);

            this.getView().setModel(new sap.ui.model.json.JSONModel({
                key: this._key,
                mode: this._mode
            }, true), "viewData");

            this.getView().setModel(new sap.ui.model.json.JSONModel([]), "tableAtribTUData");
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
                oRouter.navTo("RouteList", {}, {}, true);
            }
        },
        onButtonAddRowPress: function (oEvent) {
            let oModel = this.getView().getModel("tableAtribTUData");
            let aData = oModel.getData();
            aData.push({ ...this._templateVeiculoAtribUnidTransp });
            oModel.setData(aData);
        },

        onSelectDialogPress: function (oEvent) {
            var oInput = oEvent.getSource();
            this.onSelectDialog(oEvent, {
                title: oInput.data("title"),
                key: oInput.data("key"),
                path: oInput.data("path").replaceAll('#', '&'),
                multiSelect: oInput.data("multi"),
                descr: oInput.data("descr")
            })
        },
        onSelectDialog: function (oEvent, oSettings) {

            this.inputId = {};
            this.inputId.Id = oEvent.getSource().getId();
            this.inputId.Element = oEvent.getSource();

            this.Settings = oSettings;
            this.newPath = oSettings.path;
            var isTrueSet = (oSettings.multiSelect === 'true');
            var sServiceUrl = "";
            var oModel = this.getView().getModel();

            var aFilters = [];

            vm.lastValueStateDialog = vm.getView().byId(vm.inputId.Id).getValueState();

            if (vm.inputId.Id.includes("inputLgort")) {

                let oLineList = oEvent.getSource().getParent().getBindingContext().getObject();

                var oFilter = new Filter("Contrato", sap.ui.model.FilterOperator.EQ, oLineList.Contrato);
                aFilters.push(oFilter);
            }

            if (!this._genericDialog || this.old != this.newPath) {
                this._genericDialog = new sap.m.SelectDialog({
                    title: oSettings.title,
                    //multiSelect: isTrueSet,
                    rememberSelections: true,
                    items: {
                        path: oSettings.path,
                        filters: aFilters,
                        template: new sap.m.StandardListItem({
                            title: "{path:'" + oSettings.key + "',targetType: 'any'}",
                            description: "{path:'" + oSettings.descr + "'}"
                        })
                    },
                    search: function (evtSearch) {
                        var sValue = evtSearch.getParameter("value");
                        // var oList = this.byId("list");
                        // oList.bindItems({ path: '/ZshTuSet', parameters: { custom: { 'search': sValue } } });
                        var oBind = this.getBinding("items")

                        // Atribuindo o parametro de Search na chamado do serviço, usando o binding 
                        if (!oBind.mParameters) {
                            oBind.mParameters = {};
                        }
                        if (!oBind.mParameters.custom) {
                            oBind.mParameters.custom = {};
                        }
                        oBind.mParameters.custom.search = sValue;

                        oBind.sCustomParams = this.getModel().createCustomParams(oBind.mParameters)
                        oBind.refresh();
                        // let oBindingInfo = evtSearch.getSource().getBindingInfo("items");

                        // if (!oBindingInfo.parameters) {
                        //     oBindingInfo.parameters = {};
                        // }

                        // if (!oBindingInfo.parameters.custom) {
                        //     oBindingInfo.parameters.custom = {};
                        // }
                        // oBindingInfo.parameters.custom.search = sValue;

                        // evtSearch.getSource().bindItems(oBindingInfo);
                    },
                    confirm: function (evt) {
                        if (vm.Settings.multiSelect == "true") {
                            var aSelectedItems = evt.getParameter("selectedItems"),
                                oMultiInput = vm.getView().byId(vm.inputId.Id);

                            if (aSelectedItems && aSelectedItems.length > 0) {
                                aSelectedItems.forEach(function (oItem) {
                                    oMultiInput.addToken(new Token({
                                        text: oItem.getTitle()
                                    }));
                                });
                            }
                        } else {
                            var oSelectedItem = evt.getParameter("selectedItem");
                            if (oSelectedItem) {

                                let oBindingContextVH = oSelectedItem.getBindingContext();

                                let inputField = vm.getView().byId(vm.inputId.Id) ? vm.getView().byId(vm.inputId.Id) : vm.inputId.Element;
                                // inputField.setValue(oSelectedItem.getTitle());
                                // inputField.fireChange();

                                let oBindingInput = inputField.getBinding('value');

                                let oTargetModel = oBindingInput.getModel();
                                let sPathTuNumber = oBindingInput.getResolvedPath();
                                oTargetModel.setProperty(sPathTuNumber, oBindingContextVH.getProperty('TuNumber'));

                                let sPathTuText = sPathTuNumber.replace('TuNumber','TuText');
                                oTargetModel.setProperty(sPathTuText, oBindingContextVH.getProperty('TuText'));
                            }
                        }

                    },
                    cancel: function (evt) {
                        vm.getView().byId(vm.inputId.Id).setValueState(vm.lastValueStateDialog);
                    }
                });

                this._genericDialog.setModel(oModel);

                //this._valueHelpSelectDialog.attachConfirm(this.handleClose);
                // this.old = oSettings.path;
            }
            this._genericDialog.setMultiSelect(isTrueSet);
            this._genericDialog.open();

        },
        _onRouteMatched: function (oEvent) {
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
                            delete aResults[i].__metadata;
                            aResults[i]["mode"] = cModeDisplay;
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

            let aDataVeiculoAtribUnidTransp = this.getView().getModel("tableAtribTUData").getData();
            oSendData.VeiculoAtribUnidTransp = [];

            for (let i = 0; i < aDataVeiculoAtribUnidTransp.length; i++) {
                let element = { ...aDataVeiculoAtribUnidTransp[i] };

                if (element.mode === cModeInsert) {
                    delete element.mode;
                    element.Vehicle = this._key;
                    oSendData.VeiculoAtribUnidTransp.push({ ...element });
                }
            }

            try {
                oDataModel.create("/VeiculoSet", oSendData, {
                    success: function (oData, response) {
                        MessageBox.success("Dados gravados com sucesso!", {
                            onClose: function () {
                                var oSmartForm = that.getView().byId("idSmartForm");
                                oSmartForm._toggleEditMode();

                                that._loadData(that._key);
                                // let oModelVeiculoAtribUnidTransp = that.getView().getModel("tableAtribTUData");

                                // let aDataVeiculoAtribUnidTransp = oModelVeiculoAtribUnidTransp.getData();

                                // for (let i = 0; i < aDataVeiculoAtribUnidTransp.length; i++) {
                                //     let element = { ...aDataVeiculoAtribUnidTransp[i] };

                                //     element.mode = cModeDisplay;
                                // }
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
        }
    });
});