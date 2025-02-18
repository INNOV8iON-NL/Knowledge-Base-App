sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/FormattedText",
    "sap/ui/model/json/JSONModel",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/ui/codeeditor/CodeEditor"
],
    function (Controller, FormattedText, MessageBox, JSONModel, RichTextEditor, CodeEditor) {
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
                // this.getView().byId("articleCombobox").setModel(oModel);
            },

            getRouter: function () {
                return sap.ui.core.UIComponent.getRouterFor(this);
            },
            _onObjectMatched: function (oEvent) {
                var oArgs = oEvent.getParameter("arguments");
                let oView = this.getView();
                this._sArticleId = oArgs.GuID;
                let sContentPath = "/Articles(guid'" + this._sArticleId + "')" + "/to_contentValue";
                let sCodePath = "/Articles(guid'" + this._sArticleId + "')" + "/to_codeValue";
                // let formattedText = new sap.m.FormattedText({
                //     text:"new text"
                // });


                this.renderDisplayControls(sContentPath, sCodePath);

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
                // sap.ui.getCore().byId('backBtn').attachPress(this.mainNavPress, this);

                //  Press event needs to be detached so it`s not giving a warning for pressing other pages` nav buttons
                this.oView.addEventDelegate({
                    onBeforeHide: function (oEvent) {

                        //Reset possible changes and input states
                        // this.onCancel();

                        // sap.ui.getCore().byId('backBtn').detachPress(this.mainNavPress, this);
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
                let sContentPath = "/" + sMainPath + "/to_contentValue";
                let sCodePath = "/" + "/to_codeValue";

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

                this.renderDisplayControls(sContentPath, sCodePath);

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

            renderDisplayControls: function (sContentPath, sCodePath) {
                //remove items so they are not displayed every time the page loads again
                this.getView().byId("articleContent").removeAllItems();
                this.getView().byId("articleCode").removeAllItems();
                this.getView().byId("articleCodeType").removeAllItems();
                let oDate = Date.now();


                // /Content(guid'xxx')
                this.getView().getModel().read(sContentPath, {
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

                //display Code value
                this.getView().getModel().read(sCodePath, {
                    success: function (oData) {
                        for (let x = 0; x < oData.results.length; x++) {
                            let oEditor = new sap.ui.codeeditor.CodeEditor({
                                value: "{CodeValue}",
                                type: "{CodeType}",
                                editable: false,
                                width: "100%",
                                height: "500px"
                            })

                            //Create binding path
                            const sCodePath = this.getView().getModel().createKey("CodeValue", {
                                GuID: oData.results[x].GuID,
                                ArticleGuID: oData.results[x].ArticleGuID
                            });

                            oEditor.bindElement("/" + sCodePath);
                            this.getView().byId("articleCode").insertItem(oEditor);
                        }
                    }.bind(this),
                    error: function (oError) {
                        console.log(oError);
                    }
                })
            },

            renderEditControls: function () {
                let oView = this.getView();
                oView.byId("articleContent").removeAllItems();
                oView.byId("articleCode").removeAllItems();
                oView.byId("articleCodeType").removeAllItems();
                let oDate = Date.now();

                let contentGuID = oView.getBindingContext().getObject().GuID;
                let sPath = oView.getModel().createKey("Articles", {
                    GuID: contentGuID
                });

                let oNewContentButton = new sap.m.Button({
                    text: "Add new textbox",
                    icon: "sap-icon://add",
                    press: function(){
                        let oRichText = new RichTextEditor({
                            width: "100%",
                            height: "450px",
                            id: 'Button1'
                        });
                        oView.byId("articleContent").insertItem(oRichText);
                    }
                });

                oView.byId("articleContent").insertItem(oNewContentButton);

                //Create textboxes and delete buttons for content
                oView.getModel().read("/" + sPath + "/to_contentValue", {
                    success: function (oData) {
                        for (let x = 0; x < oData.results.length; x++) {

                            //This one still needs binding
                            let oRichText = new RichTextEditor({
                                value: "{ContentValue}",
                                width: "100%",
                                height: "450px",
                                id: "Richtext" + oData.results[x].GuID
                            });

                            let oDeleteButton = new sap.m.Button({
                                text: "Delete textbox",
                                icon: "sap-icon://delete",
                                //GuID alone is invalid id
                                id: "b"+ oData.results[x].GuID,
                                press: function (oEvent) {
                                    let oIdLong = oEvent.getSource().sId;
                                    //slice off the b from button id
                                    let oId = oIdLong.substring(1);
                                    this.contentGuID = contentGuID;
                                    this.oView = oView;
                                    this.sPath = sPath;
                                    let oElementsArr = oView.byId("articleContent");
                                    let oElement = oElementsArr.getItems();
                                    for (let x = 0; x < oElement.length; x++) {
                                        //If Id contains sId, remove from view + delete from database
                                        if (oElement[x].sId.includes(oId)) {
                                            oView.getModel().remove("/ContentValue(GuID=guid'" + oId + "',ArticleGuID=guid'" + contentGuID + "')");
                                            oElementsArr.removeItem(oElement[x]);
                                        }
                                    }
                                }
                            });

                            // Create binding path
                            const sContentPath = oView.getModel().createKey("ContentValue", {
                                GuID: oData.results[x].GuID,
                                ArticleGuID: oData.results[x].ArticleGuID
                            });

                            // Bind formatted text to content path
                            oRichText.bindElement("/" + sContentPath);

                            oView.byId("articleContent").insertItem(oRichText);
                            oView.byId("articleContent").insertItem(oDeleteButton);
                        }
                    }.bind(this),
                    error: function (oData) {
                        console.log("Error")
                    }
                });






                // let contentGuID = oView.getBindingContext().getObject().GuID;
                // let sPath = oView.getModel().createKey("Articles", {
                //     GuID: contentGuID
                // });


                // oView.getModel().read("/" + sPath + "/to_contentValue", {
                //     success: function (oData) {
                //         for (let x = 0; x < oData.results.length; x++) {

                //            //DELELE BUTTON NEEDS REWORKING!     
                //             let oDeleteButton = new sap.m.Button({
                //                 text: "Delete textbox",
                //                 icon: "sap-icon://delete",
                //                 id: "Button" + oDate + contentGuID,
                //                 press: function (oEvent) {           
                //                     // //Slice down the value for sId
                //                     // let oId = oEvent.getSource().sId.slice(6, 42);
                //                     // this.oView = oView;
                //                     // this.sPath = sPath;
                //                     // this.articleGuID = articleGuID;
                //                     // let oElementsArr = oView.byId("articleContent");
                //                     // let oElement = oElementsArr.getItems();

                //                     // for (let x = 0; x < oElement.length; x++) {
                //                     //     //If Id contains sId, remove from view + delete from database
                //                     //     if (oElement[x].sId.includes(oId)) {
                //                     //         oView.getModel().remove("/ContentValue(GuID=guid'" + oId + "',ArticleGuID=guid'" + articleGuID + "')");
                //                     //         oElementsArr.removeItem(oElement[x]);
                //                     //     }
                //                     // }
                //                 }
                //             })

                //             let oRichText = new RichTextEditor({
                //                 value: "{ContentValue}",
                //                 width: "100%",
                //                 height: "450px",
                //                 id: "Richtext" + oDate
                //             })

                //             // Create binding path
                //             const sContentPath = oView.getModel().createKey("ContentValue", {
                //                 GuID: oData.results[x].GuID,
                //                 ArticleGuID: oData.results[x].ArticleGuID
                //             });

                //             // Bind formatted text to content path
                //             oRichText.bindElement("/" + sContentPath);

                //             // Add formatted text to vbox
                //             oView.byId("articleContent").insertItem(oDeleteButton);
                //             oView.byId("articleContent").insertItem(oRichText);
                //         }
                //     }.bind(this),
                //     error: function (oData) {
                //         console.log("Error")
                //     }
                // });


                // oView.byId("articleContent").insertItem(addNewText);


                // oView.getModel().read("/" + sPath + "/to_codeValue", {
                //     success: function (oData){
                //         for (let x = 0; x < oData.results.length; x++){
                //             let oEditor = new sap.ui.codeeditor.CodeEditor({
                //                 value: "{CodeValue}",
                //                 type: "{CodeType}",
                //                 editable: true,
                //                 width: "100%",
                //                 height: "500px",
                //                 id: "CodeEditor" + oData.results[x].GuID
                //             })

                //             //Create binding path
                //             const sCodePath = oView.getModel().createKey("CodeValue", {
                //                 GuID: oData.results[x].GuID,
                //                 ArticleGuID: oData.results[x].ArticleGuID
                //             });
                //             oEditor.bindElement("/" + sCodePath);

                //             oView.byId("articleCode").insertItem(oEditor);
                //         }
                //     }.bind(this),
                //     error: function (oData){
                //         console.log("Error")
                //     }
                // });
            },
        });
    });

// onDelete: function (oEvent) {
//     const oTable = this.getView().byId("innerTableId");
//     const aSelectedItems = oTable.getSelectedItems();

//     for (let i = 0; i < aSelectedItems.length; i++) {

//         const oContext = aSelectedItems[i].getBindingContext();
//         const sPath = oContext.getPath();
//         const sTitle = oContext.getObject().Title;

//         MessageBox.warning("Article '" + sTitle + "' will be deleted.", {
//             actions: ["Delete", MessageBox.Action.CANCEL],
//             emphasizedAction: "Delete",
//             onClose: function (sAction) {
//                 if (sAction == "Delete") {
//                     this.getView().getModel().remove(sPath);
//                 } else {
//                     return;
//                 }
//             }.bind(this),
//             dependentOn: this.getView()
//         })
//         this.getView().getModel().submitChanges();
//     }
// },

// let oButton = new sap.m.Button({
//     text: "Delete textbox",
//     icon: "sap-icon://delete",
//     id: "Button" + oDate,
//     press: function(oEvent){
//         //Slice down the value for oDate
//         let oId = oEvent.getSource().sId.slice(6, 19);
//         this.oView = oView;
//         let oElementsArr = oView.byId("wizardVBoxId");
//         let oElement = oElementsArr.getItems();

//         for (let x = 0; x < oElement.length; x++){
//             //If Id contains oDate, remove from view
//             if(oElement[x].sId.includes(oId)){
//                 oElementsArr.removeItem(oElement[x]);
//             }
//         }
//     }
