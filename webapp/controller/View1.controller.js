sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageToast",
],
    function (Controller, MessageBox, Filter, FilterOperator, MessageToast) {
        "use strict";

        return Controller.extend("articlesfreestyle.controller.View1", {

            onInit: function(){
                let oSmartTable = this.getView().byId("smartTableId");
                oSmartTable.setEnableCopy(false);
            },

            //----------------- Go to details ------------------------- 

            getRouter: function () {
                return sap.ui.core.UIComponent.getRouterFor(this);
            },

            onDetailPress: function (oEvent) {
                let oItem = oEvent.getSource();
                let oCtx = oItem.getBindingContext();
                let sArticleId = oCtx.getProperty("GuID");

                this.getRouter().navTo("articles", {
                    GuID: sArticleId
                }, false);
            },

            //----------------- Filter functions -------------------------


            onSelectionChange: function (oEvent) {
                let oList = oEvent.getSource();
                let oDeleteButton = this.byId("deleteId");

                let aContexts = oList.getSelectedContexts(true);

                let bSelected = (aContexts && aContexts.length > 0);
                let sText = (bSelected) ? aContexts.length + " selected" : null;
                oDeleteButton.setVisible(bSelected);
                //oLabel.setText(sText);
            },

            //----------------- Go to create -------------------------    

            onCreate: function () {
                this.getRouter().navTo("create", false);
            },

            //----------------- Delete -------------------------       

            onDelete: function (oEvent) {
                const oTable = this.getView().byId("innerTableId");
                const aSelectedItems = oTable.getSelectedItems();

                for (let i = 0; i < aSelectedItems.length; i++) {

                    const oContext = aSelectedItems[i].getBindingContext();
                    const sPath = oContext.getPath();
                    const sTitle = oContext.getObject().Title;

                    MessageBox.warning("Article '" + sTitle + "' will be deleted.", {
                        actions: ["Delete", MessageBox.Action.CANCEL],
                        emphasizedAction: "Delete",
                        onClose: function (sAction) {
                            if (sAction == "Delete") {
                                this.getView().getModel().remove(sPath);
                            } else {
                                return;
                            }
                        }.bind(this),
                        dependentOn: this.getView()
                    })
                    this.getView().getModel().submitChanges();
                }
            },
        });
    });

