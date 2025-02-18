sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/ui/model/type/DateTime",
    "sap/ui/codeeditor/CodeEditor"

],
    function (Controller, MessageBox, RichTextEditor, DateTime, CodeEditor) {
        "use strict";

        return Controller.extend("articlesfreestyle.controller.Create", {

            //Variable for checking if inputs are valid
            _isValid: "",


            onInit: function () {
                var oRouter = this.getRouter();
                oRouter.getRoute("create").attachMatched(this._onObjectMatched, this);
            },

            getRouter: function () {
                return sap.ui.core.UIComponent.getRouterFor(this);
            },

            _onObjectMatched: function () {
                const oView = this.getView();
                const oEntry = oView.getModel().createEntry("/Articles");
                const sPath = oEntry.getPath();
                const oFinishButton = oView.byId("newArticleWizard");
                const oMultiInput = oView.byId("multiInputId");
                const oRichText = oView.byId("richtextEditorId");
                // const mainButton = sap.ui.getCore().byId('backBtn');

                oView.bindElement({
                    path: sPath
                });

                this._sPath = sPath;

                // oRichText.bindElement({
                //     path: "/" + sPath + "/to_content"
                // })

             
                oView.byId("multiInputId").removeAllTokens();
                this.resetWizard();
                //this.onCreateNewRichText();
                oFinishButton.setFinishButtonText("Submit");
                oMultiInput.attachBrowserEvent('mouseout', (oEvent) => {
                    if (oMultiInput.getTokens().length < 1) {
                        oMultiInput.setValueState("Error");
                        this.getView().byId("newArticleWizard").invalidateStep(this.getView().byId("TitleStep"));
                    }
                })
            },

            //----------------- Function for creating tokens for input  -------------------------
            tokenChange: function (oEvent) {
                const sValue = oEvent.getParameter("value").trim().toUpperCase();
                const tokens = [];
                tokens.push(sValue);
                const oMultiInput = this.getView().byId("multiInputId");

                //create tokens for the input
                for (let i = 0; i < tokens.length; i++) {
                    let newToken = new sap.m.Token({
                        text: tokens[i]
                    });
                    oMultiInput.addToken(newToken);
                };

                //set inputvalue to 0 so text value dissappears
                oMultiInput.setValue(null);

                this.validateArticleWizard();
            },

            validateArticleWizard: function () {
                let oTitle = this.getView().byId("articleTitleId").getValue();
                let oCategory = this.getView().byId("multiInputId").getTokens();
                let oDescription = this.getView().byId("descriptionId").getValue();

                if (oTitle == "" || oTitle == undefined) {
                    this.getView().byId("articleTitleId").setValueState("Error");
                } else {
                    this.getView().byId("articleTitleId").setValueState("None");
                }

                if (oDescription == "" || oDescription == undefined) {
                    this.getView().byId("descriptionId").setValueState("Error");
                } else {
                    this.getView().byId("descriptionId").setValueState("None");
                }

                if (oCategory.length < 1) {
                    this.getView().byId("multiInputId").setValueState("Error");
                } else {
                    this.getView().byId("multiInputId").setValueState("None");
                }

                if (oTitle == "" || oTitle == undefined || oDescription == "" || oDescription == undefined || oCategory.length < 1) {
                    this.getView().byId("newArticleWizard").invalidateStep(this.getView().byId("TitleStep"));
                    return false;
                } else {
                    this.getView().byId("newArticleWizard").validateStep(this.getView().byId("TitleStep"));
                    this.getView().byId("newArticleWizard").validateStep(this.getView().byId("ContentStep"));
                    return true;
                }
            },

            validateContentWizard: function () {
                let oRichtext = this.getView().byId("richtextEditorId");

                if (oRichtext.getValue() == "" || oRichtext.getValue() === undefined) {
                    oRichtext.addStyleClass("richtextWarning");
                    this.getView().byId("newArticleWizard").invalidateStep(this.getView().byId("ContentStep"));
                    return false;
                } else {
                    oRichtext.removeStyleClass("richtextWarning");
                    this.getView().byId("newArticleWizard").validateStep(this.getView().byId("ContentStep"));
                    return true;
                }
            },


            //----------------- Submit function  -------------------------
            handleWizardSubmit: function () {
                let oValidFirstStep = this.validateArticleWizard();
                //let oValidSecondStep = this.validateContentWizard();
                let oVBoxContent = this.getView().byId("wizardVBoxId").getItems();
                const allTokens = this.getView().byId("multiInputId").getTokens();
                const tokenTextArr = [];
                let oAllContent = [];
                let oAllCode = [];


                for (let x = 0; x < oVBoxContent.length; x++) {
                    let oContentId = oVBoxContent[x].getId();
                    //Select Richtext editors from VBox items
                    if (oContentId.includes("richtextEditor")) {
                        oAllContent.push(oVBoxContent[x].getValue());
                        //Select codeEditors from VBox items
                    } else if (oContentId.includes("codeEditorId")) {
                        oAllCode.push(oVBoxContent[x].getValue());
                    }
                }

                //get the text of each tokens
                for (let x = 0; x < allTokens.length; x++) {
                    const tokenText = allTokens[x].getText();
                    tokenTextArr.push(tokenText);
                };

                //const oContent = this.getView().byId("richtextEditorId").getValue();

                //Validation
                if (oValidFirstStep === false
                    //|| oValidSecondStep === false
                ) {
                    //show an error message, rest of code will not execute.
                    MessageBox.warning("Some information is still missing. Please inspect the form again.");
                    return false;
                };

                this.getView().getModel().submitChanges({
                    success: function (oData) {

                        const articleGuid = oData.__batchResponses[0].__changeResponses[0].data.GuID;
                        const oMultiInput = this.getView().byId("multiInputId");
                        oMultiInput.removeAllTokens();

                        //Create entry for TagName
                        for (let i = 0; i < tokenTextArr.length; i++) {
                            const oTagEntry = this.getView().getModel().createEntry("/Tags");
                            this.getView().getModel().setProperty(oTagEntry.getPath() + "/TagName", tokenTextArr[i]);
                            this.getView().getModel().setProperty(oTagEntry.getPath() + "/ArticleguID", articleGuid);
                        };

                        //Create entry for Content
                        for (let x = 0; x < oAllContent.length; x++) {
                            const oContentEntry = this.getView().getModel().createEntry("/Articles(guid'" + articleGuid + "')" + "/to_contentValue");
                            this.getView().getModel().setProperty(oContentEntry.getPath() + "/ContentValue", oAllContent[x]);
                            this.getView().getModel().setProperty(oContentEntry.getPath() + "/ArticleGuID", articleGuid);
                        };

                        for (let y = 0; y < oAllCode.length; y++){
                            const oCodeEntry = this.getView().getModel().createEntry("/Articles(guid'" + articleGuid + "')" + "/to_codeValue");
                            this.getView().getModel().setProperty(oCodeEntry.getPath() + "/CodeValue", oAllCode[y]);
                            this.getView().getModel().setProperty(oCodeEntry.getPath() + "/ArticleGuID", articleGuid);
                        }

                        this.getView().getModel().submitChanges({
                            success: function (oData) {
                            }.bind(this),
                            error: function (oError) {
                                console.log(oError);
                            }.bind(this)
                        });

                        MessageBox.success("Article was created.", {
                            onClose: function () {
                                this.getRouter().navTo("RouteView1", false);
                            }.bind(this),
                            dependentOn: this.getView()
                        })
                    }.bind(this),
                    error: function (oData) {
                        MessageBox.error("Article could not be created.");
                    }.bind(this)
                });
            },

            //----------------- Code selection change -------------------------
            selectChange: function () {
                const language = this.getView().byId("comboBoxId").getSelectedItem().getText();
                const editor = this.getView().byId("editorId");

                editor.setType(language);
            },

            //----------------- Function for main navbutton press  -------------------------
            mainNavPress: function () {
                let oRouter = this.getRouter();
                let oView = this.getView();
                oRouter.stop();

                MessageBox.warning("Are you sure you want to go back? Unsent information will be lost.", {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.CANCEL,
                    onClose: function (sAction) {
                        if (sAction == "OK") {
                            oRouter.initialize();
                            oView.byId("multiInputId").removeAllTokens();
                            oRouter.navTo("RouteView1", false);
                        } else {
                            return;
                        }
                    }
                })
            },

            discardProgress: function () {
                // this.resetWizard();
                MessageBox.warning("Leaving the page now will discard any changes made to the article. Continue?", {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.CANCEL,
                    onClose: function (sAction) {
                        if (sAction == "OK") {
                            let oNavContainer = this.getView().byId("wizardNavContainer");
                            let oCreatePage = this.getView().byId("wizardCreatePage");
                            this.getView().getModel().resetChanges();
                            oNavContainer.to(oCreatePage);
                        } else {
                            return;
                        }
                    }.bind(this),
                    dependentOn: this.getView()
                });
            },

            //----------------- Function reset/discard  -------------------------

            resetWizard: function () {
                this.getView().getModel().resetChanges();
                let oWizard = this.getView().byId("newArticleWizard");
                let oFirstStep = oWizard.getSteps()[0];
                let oVBoxContent = this.getView().byId("wizardVBoxId").removeAllItems();

                oWizard.discardProgress(oFirstStep);
                oWizard.goToStep(oFirstStep);

                this.getView().byId("multiInputId").removeAllTokens();
                this.getView().byId("multiInputId").setValueState("Error");
                this.getView().byId("comboBoxId").setSelectedKey("");
                this.getView().byId("newArticleWizard").invalidateStep(this.getView().byId("TitleStep"));
                this.getView().byId("newArticleWizard").invalidateStep(this.getView().byId("ContentStep"));
                this.getView().byId("descriptionId").setValueState("Error");
                this.getView().byId("descriptionId").setValue("");
                this.getView().byId("articleTitleId").setValueState("Error");
                this.getView().byId("articleTitleId").setValue("");
                // this.getView().byId("richtextEditorId").addStyleClass("richtextWarning");
                // this.getView().byId("richtextEditorId").setValue("");
            },

            onCreateNewRichText: function () {
                let oVBoxContent = this.getView().byId("wizardVBoxId").getItems();
                let oIndex = oVBoxContent.length;
                let oDate = Date.now();
                let oView = this.getView();

                let oButton = new sap.m.Button({
                    text: "Delete textbox",
                    icon: "sap-icon://delete",
                    id: "ContButton" + oDate,
                    press: function(oEvent){
                        //Slice down the value for oDate
                        let oId = oEvent.getSource().sId.slice(10, 23);
                        this.oView = oView;
                        let oElementsArr = oView.byId("wizardVBoxId");
                        let oElement = oElementsArr.getItems();

                        for (let x = 0; x < oElement.length; x++){
                            //If Id contains oDate, remove from view
                            if(oElement[x].sId.includes(oId)){
                                oElementsArr.removeItem(oElement[x]);
                            }
                        }                    
                    }
                });

                let oRichText = new RichTextEditor({
                    width: "100%",
                    height: "450px",
                    id:  "richtextEditorId" + oDate
                });
                
                this.getView().byId("wizardVBoxId").insertItem(oRichText, oIndex + 1);
                this.getView().byId("wizardVBoxId").insertItem(oButton, oIndex + 2);
            },

            onCreateNewCodeEditor: function (){
                let oVBoxContent = this.getView().byId("wizardVBoxId").getItems();
                let oIndex = oVBoxContent.length;
                let oDate = Date.now();
                let oView = this.getView();

                 let oCode = new sap.m.ComboBox({
                    id: "CodeTypeId",
                    placeholder: "Choose programming language",
                    items: {
                        path: "/codeCollection",
                        template: new sap.ui.core.Item({
                            key: "{key}",
                            text: "{code}"
                        })
                    }
            });

            //Set value help with code options
            let oModel = new sap.ui.model.json.JSONModel();
            oModel.loadData("model/codecollection.json");
            oCode.setModel(oModel);

                    
                let oEditor = new CodeEditor({
                    width: "100%",
                    height: "450px",
                    id: "codeEditorId" + oDate                   
                });

                oCode.attachChange(function (oEvent){
                    let oSelectedItem = oCode.getSelectedItem();
                    let sItemText = oSelectedItem.getText();
                    oEditor.setType(sItemText);
                });

                let oButton = new sap.m.Button({
                    text: "Delete codeeditor",
                    icon: "sap-icon://delete",
                    id: "CodeButton" + oDate,
                    press: function(oEvent){
                        //Slice down the value for oDate
                        let oId = oEvent.getSource().sId.slice(10, 23);
                        this.oView = oView;
                        let oElementsArr = oView.byId("wizardVBoxId");
                        let oElement = oElementsArr.getItems();

                        for (let x = 0; x < oElement.length; x++){
                            //If Id contains oDate, remove from view
                            if(oElement[x].sId.includes(oId)){
                                oElementsArr.removeItem(oElement[x]);
                            }
                        }                    
                    }
                });

                this.getView().byId("wizardVBoxId").insertItem(oCode, oIndex + 1)
                this.getView().byId("wizardVBoxId").insertItem(oEditor, oIndex + 2);
                this.getView().byId("wizardVBoxId").insertItem(oButton, oIndex + 3);                
            },
        },
        );
    });


//Later (this was placed in _onObjectMatched)
// const sapTitle = sap.ui.getCore().byId('shellAppTitle');
// document.getElementsByTagName('a')[1].onclick = function() {console.log("hello world")}
//   sapTitle.attachPress(this.mainNavPress, this);

//  Manipulate the main nav button to warn user about data loss
// mainButton.attachPress(this.mainNavPress, this);

//  Press event needs to be detached so it`s not giving a warning for pressing other pages` nav buttons
// this.oView.addEventDelegate({
//     onBeforeHide: function (oEvent) {
//         mainButton.detachPress(this.mainNavPress, this);
//     }
// }, this)