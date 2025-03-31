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
            _iOrderIndex: 0,


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


            createInitialButtons: function(){
                let oCodeButton = new sap.m.Button({
                    text: "Add new codeeditor",
                    icon: "sap-icon://source-code",
                });

                let oTextButton = new sap.m.Button({
                    text: "Add new textbox",
                    icon: "sap-icon://text",
                })
                this.getView().byId("buttonContainerId").insertItem(oTextButton);
                this.getView().byId("buttonContainerId").insertItem(oCodeButton);

                oCodeButton.attachPress((oEvent) => {
                    this.onCreateNewCodeEditor()}
                );

                oTextButton.attachPress((oEvent) => {
                    this.onCreateNewRichText()}
                );
            },


            //----------------- Submit function  -------------------------
            handleWizardSubmit: function () {
                let oValidFirstStep = this.validateArticleWizard();
                //let oValidSecondStep = this.validateContentWizard();
                let oVBoxContent = this.getView().byId("wizardVBoxId").getItems();
                const allTokens = this.getView().byId("multiInputId").getTokens();
                const tokenTextArr = [];
                let aContent = [];
                let aCode = [];


                for (let x = 0; x < oVBoxContent.length; x++) {
                    let oContentId = oVBoxContent[x].getId();
                    //Select Richtext editors from VBox items
                    if (oContentId.includes("rich")) {

                        //Convert string to integer to match datatype in backend
                        let iIndex = parseInt(oContentId.slice(17));

                        let oTextItems = oVBoxContent[x].getItems();

                        //push to array as 2. array to keep them together
                        aContent.push([oTextItems[0].getValue(), iIndex]);
                        
                        //Select codeEditor + type from VBox items
                    } else if (oContentId.includes("code")) {
                        let oCodeItems = oVBoxContent[x].getItems();                       
                        let type = oCodeItems[1].getType();
                        let code = oCodeItems[1].getValue();

                        //Convert string to integer to match datatype in backend
                        let iIndex = parseInt(oContentId.slice(17));

                        //push to array as 2. array to keep them together
                        aCode.push([type, code, iIndex]);
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
                        for (let x = 0; x < aContent.length; x++) {
                            const oContentEntry = this.getView().getModel().createEntry("/Articles(guid'" + articleGuid + "')" + "/to_contentValue");
                            this.getView().getModel().setProperty(oContentEntry.getPath() + "/ContentValue", aContent[x][0]);
                            this.getView().getModel().setProperty(oContentEntry.getPath() + "/OrderIndex", aContent[x][1]);
                            this.getView().getModel().setProperty(oContentEntry.getPath() + "/ArticleGuID", articleGuid);
                        };

                         //Create entry for Code
                        for (let y = 0; y < aCode.length; y++){
                            const oCodeEntry = this.getView().getModel().createEntry("/Articles(guid'" + articleGuid + "')" + "/to_codeValue");
                            this.getView().getModel().setProperty(oCodeEntry.getPath() + "/CodeType", aCode[y][0]);
                            this.getView().getModel().setProperty(oCodeEntry.getPath() + "/CodeValue", aCode[y][1]);
                            this.getView().getModel().setProperty(oCodeEntry.getPath() + "/OrderIndex", aCode[y][2]);
                            this.getView().getModel().setProperty(oCodeEntry.getPath() + "/ArticleGuID", articleGuid);
                        };


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
                // this.getView().byId("comboBoxId").setSelectedKey("");
                this.getView().byId("newArticleWizard").invalidateStep(this.getView().byId("TitleStep"));
                this.getView().byId("newArticleWizard").invalidateStep(this.getView().byId("ContentStep"));
                this.getView().byId("descriptionId").setValueState("Error");
                this.getView().byId("descriptionId").setValue("");
                this.getView().byId("articleTitleId").setValueState("Error");
                this.getView().byId("articleTitleId").setValue("");
                this.createInitialButtons();
                this._iOrderIndex = 0;
                // this.getView().byId("richtextEditorId").addStyleClass("richtextWarning");
                // this.getView().byId("richtextEditorId").setValue("");
            },

            deleteContent: function(oEvent) {
                let oId = oEvent.getSource().sId.slice(10, 23);
                let oView = this.getView();
                let oElementsArr = oView.byId("wizardVBoxId");
                let oElement = oElementsArr.getItems();

                for (let x = 0; x < oElement.length; x++) {
                    //If Id contains oDate, remove from view
                    if (oElement[x].sId.includes(oId)) {
                        oElementsArr.removeItem(oElement[x]);
                    }
                };
                //Get new length of oElementsArr
                let newElementsArr = oElementsArr.getItems();
                //Check if there are any elements left
                newElementsArr.length === 0 ? this.createInitialButtons() : ""
            },


            onCreateNewRichText: function (oEvent, buttonIndex) {
                let oOuterBox =  this.getView().byId("wizardVBoxId");
                let oVBoxContent = oOuterBox.getItems();
                let oIndex = oVBoxContent.length;
                let oDate = Date.now();
                let oView = this.getView();
                let oContainer = oView.byId("buttonContainerId");
                let oModel = this.getView().getModel();
                let iCurrentIndex = this._iOrderIndex

                  // Loop over container items and update the create buttons
                  for (let x = 0; x < oVBoxContent.length; x++) {
                    //Get items for either richtext or code
                    let aItems = oVBoxContent[x].getItems();
                    if (oVBoxContent[x].sId.includes("code")) {
                        //In case of updating codeeditor buttons
                        this.handleContentCreation(aItems, true, buttonIndex); // Pass `true` for CodeEditor
                    } else {
                        //In case of updating richtext buttons
                        this.handleContentCreation(aItems, false, buttonIndex); // Pass `false` for RichText
                    }
                }

                let oContext = oModel.createEntry(this._sPath + "/to_contentValue", { 
                    properties: { ContentValue: "", OrderIndex: iCurrentIndex, ArticleGuID: ""}
                });

                let oButtonHBox = new sap.m.HBox();

                let oTextVBox = new sap.m.VBox({
                    //id affects handleWizardSubmit 
                    id: "rich" + oDate + iCurrentIndex
                });

                let oDeleteButton = new sap.m.Button({
                    text: "Delete textbox",
                    icon: "sap-icon://delete",
                    id: "ContButton" + oDate
                });

                let oRichTextButton = new sap.m.Button({
                    text: "Add new text block",
                    icon: "sap-icon://text"
                });

                let oCodeButton = new sap.m.Button({
                    text: "Add new code block",
                    icon: "sap-icon://source-code"
                });

                let iButtonIndex = this._iOrderIndex; 

                oRichTextButton.attachPress((oEvent) => {
                    this.onCreateNewRichText(oEvent, iButtonIndex);
                });

                oCodeButton.attachPress(function(){
                    this.onCreateNewCodeEditor();
                }, this)

                let oRichText = new RichTextEditor({
                    width: "100%",
                    height: "450px",
                    showGroupFont: true,
                    value: "{ContentValue}"
                });

                oDeleteButton.attachPress((oEvent) => {
                    this.deleteContent(oEvent, iCurrentIndex);
                });

                oRichText.setBindingContext(oContext);
                oTextVBox.addStyleClass("sapUiLargeMarginBottom");
                oTextVBox.insertItem(oRichText, oIndex + 1);
                oTextVBox.insertItem(oButtonHBox, oIndex + 2);
                oButtonHBox.insertItem(oDeleteButton);
                oButtonHBox.insertItem(oRichTextButton);
                oButtonHBox.insertItem(oCodeButton);
                this.getView().byId("wizardVBoxId").insertItem(oTextVBox);
                this._iOrderIndex++;

                this._iOrderIndex > 0 ? oContainer.destroyItems() : ""

                 //Get all outer VBox items
                 let newVBox = oOuterBox.getItems(); //vboxes for richtext and code

                 //Sort in ascending order
                 newVBox.sort(function (vbox1, vbox2) {
                     //if it`s a richtext vbox, look for first item, if codeeditor vbox look for second
                     let oItem1 = vbox1.sId.includes("rich") ? vbox1.getItems()[0] : vbox1.getItems()[1];
                     let oItem2 = vbox2.sId.includes("rich") ? vbox2.getItems()[0] : vbox2.getItems()[1];
 
                     let itemOrderIndex1 = oItem1.getBindingContext().getProperty('OrderIndex');
                     let itemOrderIndex2 = oItem2.getBindingContext().getProperty('OrderIndex');
 
                     return itemOrderIndex1 - itemOrderIndex2;
                 });
                 oOuterBox.removeAllItems();  // Clear all items first
                 newVBox.forEach(function (vbox) {
                    oOuterBox.addItem(vbox);  // Add items back in sorted order
                 });
            },

            onCreateNewCodeEditor: function (oEvent, buttonIndex) {
                // let sVBoxId = await this.onCreateVBox();
                let oVBoxContent = this.getView().byId("wizardVBoxId").getItems();
                let oDate = Date.now();
                let oView = this.getView();
                let oContainer = oView.byId("buttonContainerId");
                let oModel = this.getView().getModel();


                // Loop over container items and update the create buttons
                for (let x = 0; x < oVBoxContent.length; x++) {
                    //Get items for either richtext or code
                    let aItems = oVBoxContent[x].getItems();
                    if (oVBoxContent[x].sId.includes("code")) {
                        //In case of updating codeeditor buttons
                        this.handleContentCreation(aItems, true); // Pass `true` for CodeEditor
                    } else {
                        //In case of updating richtext buttons
                        this.handleContentCreation(aItems, false); // Pass `false` for RichText
                    }
                }

                let oTextVBox = new sap.m.VBox({
                    //id affects handleWizardSubmit 
                    id: "code" + oDate + this._iOrderIndex
                });

                let oButtonHBox = new sap.m.HBox();

                let oCode = new sap.m.ComboBox({
                    id: "CodeTypeId" + oDate + this._iOrderIndex,
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
                let oJsonModel = new sap.ui.model.json.JSONModel();
                oJsonModel.loadData("/model/codecollection.json");
                oJsonModel.setSizeLimit(160);
                oCode.setModel(oJsonModel);

                let oEditor = new CodeEditor({
                    width: "100%",
                    height: "450px"
                });

                oCode.attachChange(function (oEvent) {
                    let oSelectedItem = oCode.getSelectedItem();
                    let sItemText = oSelectedItem.getText();
                    oEditor.setType(sItemText);
                });

                let oDeleteButton = new sap.m.Button({
                    text: "Delete codeeditor",
                    icon: "sap-icon://delete",
                    id: "CodeButton" + oDate
                });

                let oRichTextButton = new sap.m.Button({
                    text: "Add new text block",
                    icon: "sap-icon://text"
                });

                let oCodeButton = new sap.m.Button({
                    text: "Add new code block",
                    icon: "sap-icon://source-code"
                });

                oRichTextButton.attachPress(function(){
                    this.onCreateNewRichText();
                }, this)

                oCodeButton.attachPress(function(){
                    this.onCreateNewCodeEditor();
                }, this)

                oDeleteButton.attachPress((oEvent) => {
                    this.deleteContent(oEvent)
                });

                let oContext = oModel.createEntry(this._sPath + "/to_codeValue", {
                    properties: { CodeValue: "", CodeType: "", OrderIndex: this._iOrderIndex, ArticleGuID: "" }
                });

                oTextVBox.setBindingContext(oContext);

                oTextVBox.addStyleClass("sapUiLargeMarginBottom");
                oTextVBox.insertItem(oCode)
                oTextVBox.insertItem(oEditor);
                oTextVBox.insertItem(oButtonHBox);
                oButtonHBox.insertItem(oDeleteButton);
                oButtonHBox.insertItem(oRichTextButton);
                oButtonHBox.insertItem(oCodeButton);
                this.getView().byId("wizardVBoxId").insertItem(oTextVBox);
                this._iOrderIndex++;

                this._iOrderIndex > 0 ? oContainer.destroyItems() : ""

                
                //Get all outer VBox items
                let newVBox = oVBoxContent.getItems(); //vboxes for richtext and code

                //Sort in ascending order
                newVBox.sort(function (vbox1, vbox2) {
                    //if it`s a richtext vbox, look for first item, if codeeditor vbox look for second
                    let oItem1 = vbox1.sId.includes("rich") ? vbox1.getItems()[0] : vbox1.getItems()[1];
                    let oItem2 = vbox2.sId.includes("rich") ? vbox2.getItems()[0] : vbox2.getItems()[1];

                    let itemOrderIndex1 = oItem1.getBindingContext().getProperty('OrderIndex');
                    let itemOrderIndex2 = oItem2.getBindingContext().getProperty('OrderIndex');

                    return itemOrderIndex1 - itemOrderIndex2;
                });
                oVBoxContent.removeAllItems();  // Clear all items first
                newVBox.forEach(function (vbox) {
                    oVBoxContent.addItem(vbox);  // Add items back in sorted order
                });
            },

            // Helper function to decide if richtext or codeeditor buttons need to be updated
            handleContentCreation: function (aItems, isCodeEditor, buttonIndex){
                 //aItems are the outer VBoxcontainer items (either richtext-container or codeeditor-container)
                 let iItemIndex = aItems[isCodeEditor ? 1 : 0].getBindingContext().getProperty('OrderIndex');
                 console.log(iItemIndex);

                 if( buttonIndex < iItemIndex  ){
                    let newItemIntex = iItemIndex + 1;
                    //Depending on the editor either aItems[1] = codeeditor, or aItems[0] = richtexteditor
                    let sBindingPath = aItems[isCodeEditor ? 1 : 0].getBindingContext().getPath();
                    aItems[isCodeEditor ? 1 : 0].getBindingContext().getModel().setProperty(sBindingPath + '/OrderIndex', newItemIntex);

                     //Depending on the editor access HBox for buttons 
                     let aHBox = aItems[isCodeEditor ? 2 : 1];
                     aHBox.getItems()[1].destroy();
                     aHBox.getItems()[0].destroy();
 
                     let oNewCodeButton = new sap.m.Button({
                         text: "Add new codeeditor",
                         icon: "sap-icon://source-code",
                         id: "CodeEditor" + Date.now() + newItemIntex
                     });
 
                     let oNewRichTextButton = new sap.m.Button({
                         text: "Add new textbox",
                         icon: "sap-icon://text",
                         id: "RichText" + Date.now() + newItemIntex
                     });
 
                     aHBox.insertItem(oNewCodeButton, 0);
                     aHBox.insertItem(oNewRichTextButton, 1);
 
                     oNewCodeButton.attachPress((oEvent) => {
                         this.onCreateNewCodeEditor(oEvent, newItemIntex);
                     });
 
                     oNewRichTextButton.attachPress((oEvent) => {
                         this.onCreateNewRichText(oEvent, newItemIntex);
                     })
                 }
            }
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