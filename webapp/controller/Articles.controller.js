sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/FormattedText",
    "sap/ui/model/json/JSONModel",
    "sap/ui/richtexteditor/RichTextEditor"
],
    function (Controller, FormattedText, MessageBox, JSONModel, RichTextEditor) {
        "use strict";

        return Controller.extend("articlesfreestyle.controller.Articles", {

            //Variable for checking if editing mode is active
            _isEditing: "",


            onInit: function () {
                var oRouter = this.getRouter();

                oRouter.getRoute("articles").attachMatched(this._onObjectMatched, this);

                const oModel = new JSONModel();
                oModel.setSizeLimit(200);
                oModel.loadData("model/codecollection.json");
                this.getView().byId("articleCombobox").setModel(oModel);
            },

            getRouter: function () {
                return sap.ui.core.UIComponent.getRouterFor(this);
            },
            _onObjectMatched: function (oEvent) {
                var oArgs = oEvent.getParameter("arguments");
                let oView = this.getView();
                this._sArticleId = oArgs.GuID;
                let sPath = "/Articles(guid'" + this._sArticleId + "')" + "/to_contentValue";
                // let formattedText = new sap.m.FormattedText({
                //     text:"new text"
                // });

                // console.log(sPath);

                this.renderDisplayControls(sPath);

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


                this.getView().byId("descText").setVisible(true);
                this.getView().byId("descValue").setVisible(false);
                this.getView().byId("titleContainer").setVisible(false);
                this.getView().byId("titleValue").setValueState("None");
                this.getView().byId("descValue").setValueState("None");
                // this.getView().byId("richTextId").removeStyleClass("richtextWarning");
                this.getView().byId("editButton").setVisible(true);
                this.getView().byId("saveButton").setVisible(false);
                this.getView().byId("cancelButton").setVisible(false);
                this._isEditing = false;
                this.getView().getModel().resetChanges();

                // this.onCancel();

                //  Manipulate the main nav button to warn user about data loss
                sap.ui.getCore().byId('backBtn').attachPress(this.mainNavPress, this);

                //  Press event needs to be detached so it`s not giving a warning for pressing other pages` nav buttons
                this.oView.addEventDelegate({
                    onBeforeHide: function (oEvent) {

                        //Reset possible changes and input states
                        // this.onCancel();

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
                this.renderEditControls();
                this._isEditing = true;
            },

            onSaveChanges: function (oEvent) {
                this._isValid = true;
                const sGuID = this.getView().getBindingContext().getObject().GuID;
                const sPath = `/Articles(guid'${sGuID}')`;
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
                    Code: this.getView().byId("articleEditorId").getValue,
                    // Content: this.getView().byId("richTextId").getValue,
                },
                    {
                        success: function (oData) {           
                            sap.m.MessageBox.success("Article was updated.", {
                                onClose: function () {
                                    //Refresh window so modifications appear
                                    window.location.reload();
                                }
                            });
                        }.bind(this),
                        error: function () {
                            sap.m.MessageBox.error("Article could not be updated.");
                        }
                    }
                    )
                this.getView().getModel().submitChanges();
            },

            returnIdListOfRequiredFields: function () {
                let requiredInputs;
                return requiredInputs = ['titleValue', 'descValue'];
            },
            validateEventFeedbackForm: function (requiredInputs) {
                let _self = this;
                let valid = true;
                // let richText = this.getView().byId("richTextId");

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
                // if (richText.getValue() == "" || richText.getValue() == undefined) {
                //     valid = false;
                //     richText.addStyleClass("richtextWarning");
                // }
                return valid;
            },

            //----------------- Cancel edit ------------------------- 

            onCancel: function (oEvent) {
                let sMainPath = this.getView().getModel().createKey("Articles", {
                    GuID: this.getView().getBindingContext().getObject().GuID
                });
                let sPath = "/" + sMainPath + "/to_contentValue";

                this.getView().byId("descText").setVisible(true);
                this.getView().byId("descValue").setVisible(false);
                this.getView().byId("titleContainer").setVisible(false);
                this.getView().byId("titleValue").setValueState("None");
                this.getView().byId("descValue").setValueState("None");
                // this.getView().byId("richTextId").removeStyleClass("richtextWarning");
                this.getView().byId("editButton").setVisible(true);
                this.getView().byId("saveButton").setVisible(false);
                this.getView().byId("cancelButton").setVisible(false);
                this._isEditing = false;

                this.renderDisplayControls(sPath);

                //Refresh window so possible modifications disappear
                this.getView().getModel().resetChanges();
            },

            //----------------- Selection change -------------------------

            selectChange: function () {
                const language = this.getView().byId("articleCombobox").getSelectedItem().getText();
                console.log(language);
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

            renderDisplayControls: function (sPath) {
                this.getView().byId("articleContent").removeAllItems();

                // /Content(guid'xxx')
                this.getView().getModel().read(sPath, {
                    success: function (oData) {
                        for (let x = 0; x < oData.results.length; x++) {
                            let oFormattedText = new sap.m.FormattedText({
                                htmlText: "{ContentValue}",
                                width: "100%"

                            })

                            // Create binding path
                            const sContentPath = this.getView().getModel().createKey("ContentValue", {
                                GuID: oData.results[x].GuID,
                                ArticleGuID: oData.results[x].ArticleGuID
                            });

                            // Bind formatted text to content path
                            oFormattedText.bindElement("/" + sContentPath);

                            // Add formatted text to vbox
                            this.getView().byId("articleContent").insertItem(oFormattedText);
                        };
                    }.bind(this),
                    error: function (oError) {
                        console.log(oError);
                    }
                });
            },

            renderEditControls: function () {
                this.getView().byId("articleContent").removeAllItems();

                let sPath = this.getView().getModel().createKey("Articles", {
                    GuID: this.getView().getBindingContext().getObject().GuID,
                });

                this.getView().getModel().read("/" + sPath + "/to_contentValue", {
                    success: function (oData) {
                        for (let x = 0; x < oData.results.length; x++) {
                            let oRichText = new RichTextEditor({
                                value: "{ContentValue}",
                                 width: "100%",
                                 height: "450px"
                            })

                            // Create binding path
                            const sContentPath = this.getView().getModel().createKey("ContentValue", {
                                GuID: oData.results[x].GuID,
                                ArticleGuID: oData.results[x].ArticleGuID
                            });

                            // Bind formatted text to content path
                            oRichText.bindElement("/" + sContentPath);

                            // Add formatted text to vbox
                            this.getView().byId("articleContent").insertItem(oRichText);
                        }
                        console.log("Success")
                    }.bind(this),
                    error: function (oData) {
                        console.log("Error")
                    }
                });

            },

        });
    });
