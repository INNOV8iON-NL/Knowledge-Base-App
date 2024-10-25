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

            onSuggest: function (oEvent) {
                let searchField = this.getView().byId("searchCategoryID");
                searchField.suggest();
            },

            onSearchCategory: function(oEvent){

                // oTeamsBinding.filter(new sap.ui.model.Filter({
                //     path :"TEAM_2_EMPLOYEES",operator: sap.ui.model.FilterOperator.Any,
                //     variable :"employee",
                //     condition :new sap.ui.model.Filter("employee/AGE", sap.ui.model.FilterOperator.GT,42)}););

                let sQuery = oEvent.getSource().getValue();

                let oListBinding = this.getView().byId("idTable").getBinding("items");
                oListBinding.filter(new sap.ui.model.Filter({
                    path :"Articles",
                    operator: FilterOperator.Any,
                    variable :"Tags",
                    condition : new sap.ui.model.Filter("Tags/Tagname", sap.ui.model.FilterOperator.EQ, sQuery)
                }));
            },


            onSearch: function (oEvent) {
                //add filter for search
                let aFilters = [];
                let sQuery = oEvent.getSource().getValue();
                if (sQuery && sQuery.length > 0) {
                    let filter = new Filter({
                        filters: [
                            new Filter("Title", FilterOperator.Contains, sQuery),
                            new Filter("Description", FilterOperator.Contains, sQuery),
                            new Filter("CreatedBy", FilterOperator.Contains, sQuery),
                        ],
                        or: true //sets whether Title or description should contain sQuery
                    });

                    aFilters.push(filter);
                }

                //update list binding
                let oList = this.byId("idTable");
                let oBinding = oList.getBinding("items");
                console.log(oBinding);
                oBinding.filter(aFilters);
            },

            onSelectionChange: function (oEvent) {
                let oList = oEvent.getSource();
                let oDeleteButton = this.byId("deleteId");

                let aContexts = oList.getSelectedContexts(true);

                let bSelected = (aContexts && aContexts.length > 0);
                let sText = (bSelected) ? aContexts.length + " selected" : null;
                oDeleteButton.setVisible(bSelected);
                //oLabel.setText(sText);
            },

            //----------------- Sorter function -------------------------

            onSortTitles: function (oEvent) {
                let oView = this.getView();
                let oTable = oView.byId("idTable");
                let oBinding = oTable.getBinding("items");

                let sSortKey = "Title";
                this.bDescending = !this.bDescending; //enable toggleing between true and false
                let aSorter = [];

                aSorter.push(new sap.ui.model.Sorter(sSortKey, !this.bDescending));
                oBinding.sort(aSorter);
            },

            onSortDates: function () {
                let oView = this.getView();
                let oTable = oView.byId("idTable");
                let oBinding = oTable.getBinding("items");

                let sSortKey = "LocalLastChangedAt";
                this.bDescending = !this.bDescending; //enable toggleing between true and false
                let aSorter = [];

                aSorter.push(new sap.ui.model.Sorter(sSortKey, this.bDescending));
                oBinding.sort(aSorter);
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

