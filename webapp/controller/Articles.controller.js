sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
],
    function (Controller, History, MessageBox) {
        "use strict";

        return Controller.extend("articlesfreestyle.controller.Articles", {

            //Variable for checking if editing mode is active
            _isEditing: "",


            onInit: function () {
                var oRouter = this.getRouter();
                oRouter.getRoute("articles").attachMatched(this._onObjectMatched, this);
            },

            getRouter: function () {
                return sap.ui.core.UIComponent.getRouterFor(this);
            },
            _onObjectMatched: function (oEvent) {
                var oArgs = oEvent.getParameter("arguments");
                this._sArticleId = oArgs.GuID;

                var oView = this.getView();

                oView.bindElement({
                    path: "/Articles(guid'" + this._sArticleId + "')",
                    events: {
                        change: this._onBindingChange.bind(this),
                        dataRequested: function () {
                            oView.setBusy(true);
                        },
                        dataReceived: function () {
                            oView.setBusy(false);
                        }
                    }
                });

                this.onCancel();

                //  Manipulate the main nav button to warn user about data loss
                sap.ui.getCore().byId('backBtn').attachPress(this.mainNavPress, this);

                //  Press event needs to be detached so it`s not giving a warning for pressing other pages` nav buttons
                this.oView.addEventDelegate({
                    onBeforeHide: function (oEvent) {

                        //Reset possible changes and input states
                        this.onCancel();

                        sap.ui.getCore().byId('backBtn').detachPress(this.mainNavPress, this);
                    }
                }, this)
            },



            _onBindingChange: function () {
                var oElementBinding;

                oElementBinding = this.getView().getElementBinding();
                //No data for the binding
                if (oElementBinding && !oElementBinding.getBoundContext()) {
                    this.getRouter().getTargets().display("notFound");
                }
            },


            //----------------- Function for main navbutton press  -------------------------

            mainNavPress: function () {
                let oRouter = this.getRouter();
                oRouter.stop();

                MessageBox.warning("Are you sure you want to go back? Unsent information will be lost.", {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.CANCEL,
                    onClose: function (sAction) {
                        if (sAction == "OK") {
                            oRouter.initialize();
                            oRouter.navTo("RouteView1", false);
                        } else {
                            return;
                        }
                    }
                })
            },


            //----------------- Edit functions ------------------------- 

            onEdit: function () {
                this.getView().byId("descText").setVisible(false);
                this.getView().byId("descValue").setVisible(true);
                this.getView().byId("titleContainer").setVisible(true);
                this.getView().byId("editButton").setVisible(false);
                this.getView().byId("saveButton").setVisible(true);
                this.getView().byId("cancelButton").setVisible(true);
                this.getView().byId("richTextId").setEditable(true);
                this.getView().byId("richTextId").setShowGroupClipboard(true);
                this.getView().byId("richTextId").setShowGroupTextAlign(true);
                this.getView().byId("richTextId").setShowGroupStructure(true);
                this.getView().byId("richTextId").setShowGroupLink(true);
                this.getView().byId("richTextId").setShowGroupFont(true);
                this.getView().byId("richTextId").setShowGroupFontStyle(true);
                this.getView().byId("richTextId").setShowGroupInsert(true);
                this.getView().byId("articleEditorId").setEditable(true);
                this._isEditing = true;
            },

            onSaveChanges: function (oEvent) {
                this._isValid = true;
                const sPath = `/Articles(guid'${this.getView().getBindingContext().getObject().GuID}')`

                let requiredInputs = this.returnIdListOfRequiredFields();
                let passedValidation = this.validateEventFeedbackForm(requiredInputs);

                if (passedValidation === false) {
                    //show an error message, rest of code will not execute.
                    return false;
                }
                const oContext = this.getView().getModel().update(sPath, {
                    GuID: this.getView().getBindingContext().getObject().GuID,
                    Title: this.getView().byId("titleText").getValue,
                    Description: this.getView().byId("descText").getValue,
                    Content: this.getView().byId("richTextId").getValue,
                    Code: this.getView().byId("articleEditorId").getValue,
                }, {
                    success: function () {
                        MessageBox.success("Article was updated.", {
                            onClose: function () {
                                //Refresh window so modifications appear
                                window.location.reload();
                            }
                        });
                    },
                    error: function () {
                        MessageBox.error("Article could not be updated.");
                    }
                })
                this.getView().getModel().submitChanges();

            },

            returnIdListOfRequiredFields: function () {
                let requiredInputs;
                return requiredInputs = ['titleValue', 'descValue'];
            },
            validateEventFeedbackForm: function (requiredInputs) {
                let _self = this;
                let valid = true;
                let richText = this.getView().byId("richTextId");

                requiredInputs.forEach(function (input) {
                    let sInput = _self.getView().byId(input);
                    if (sInput.getValue() == "" || sInput.getValue() == undefined) {
                        valid = false;
                        sInput.setValueState("Error");
                    }
                    else {
                        sInput.setValueState("None");
                    }
                });

                //Richtext needs separate validation since it has no valuestate property
                if (richText.getValue() == "" || richText.getValue() == undefined) {
                    valid = false;
                    richText.addStyleClass("richtextWarning");
                }
                return valid;
            },

            //----------------- Cancel edit ------------------------- 

            onCancel: function (oEvent) {
                this.getView().byId("descText").setVisible(true);
                this.getView().byId("descValue").setVisible(false);
                this.getView().byId("titleContainer").setVisible(false);
                this.getView().byId("titleValue").setValueState("None");
                this.getView().byId("descValue").setValueState("None");
                this.getView().byId("richTextId").removeStyleClass("richtextWarning");
                this.getView().byId("editButton").setVisible(true);
                this.getView().byId("saveButton").setVisible(false);
                this.getView().byId("cancelButton").setVisible(false);
                this.getView().byId("richTextId").setEditable(false);
                this.getView().byId("richTextId").setShowGroupClipboard(false);
                this.getView().byId("richTextId").setShowGroupTextAlign(false);
                this.getView().byId("richTextId").setShowGroupStructure(false);
                this.getView().byId("richTextId").setShowGroupLink(false);
                this.getView().byId("richTextId").setShowGroupFont(false);
                this.getView().byId("richTextId").setShowGroupFontStyle(false);
                this.getView().byId("richTextId").setShowGroupInsert(false);
                this.getView().byId("articleEditorId").setEditable(false);

                this._isEditing = false

                //Refresh window so possible modifications disappear
                this.getView().getModel().resetChanges();
            },

            //----------------- Selection change -------------------------

            selectChange: function () {
                const language = this.getView().byId("articleCombobox").getSelectedItem().getText();
                const editor = this.getView().byId("articleEditorId");
                editor.setType(language);
            },


            //----------------- Navigation -------------------------

            onNavBack: function () {
                if (this._isEditing == false) {
                    this.getRouter().navTo("RouteView1", false);
                } else {
                    MessageBox.warning("Leaving the page now will discard any changes made to the article. Continue?", {
                        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                        emphasizedAction: MessageBox.Action.CANCEL,
                        onClose: function (sAction) {
                            if (sAction == "OK") {
                                this.onCancel();
                                this.getRouter().navTo("RouteView1", false);
                            } else {
                                return;
                            }
                        }.bind(this),
                        dependentOn: this.getView()
                    });
                }
            },

        });
    });
