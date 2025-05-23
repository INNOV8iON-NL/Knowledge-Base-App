sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/ui/model/type/DateTime",
    "sap/ui/codeeditor/CodeEditor",
    "sap/m/Tokenizer"
],
    function (Controller, MessageBox, RichTextEditor, DateTime, CodeEditor, Tokenizer) {
        "use strict";

        return Controller.extend("articlesfreestyle.controller.Create", {

            //Variable for checking if inputs are valid
            _isValid: "",
            onInit: function () {
                var oRouter = this.getRouter();
                oRouter.getRoute("create").attachMatched(this._onObjectMatched, this);
                this._oCreateMultiInput = this.getView().byId("multiInputId");
                this._oCreateMultiInput.addValidator(this.createMultiInputValidator.bind(this._oCreateMultiInput))
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
                oMultiInput.setValueState("None");
                this.getView().byId("articleTitleId").setValueState("None");
                this.getView().byId("descriptionId").setValueState("None");

                oView.bindElement({
                    path: sPath
                });

                this._sPath = sPath;

                oView.byId("multiInputId").removeAllTokens();
                this.resetWizard();
                oFinishButton.setFinishButtonText("Submit");
                oMultiInput.attachBrowserEvent('mouseout', (oEvent) => {
                    if (oMultiInput.getTokens().length < 1) {
                        this.getView().byId("newArticleWizard").invalidateStep(this.getView().byId("TitleStep"));
                    }
                })
            },

            //----------------- Function for creating tokens for input  -------------------------

            createMultiInputValidator: function (args) {
                let oText = args.text.toUpperCase();
                let oNewToken = new sap.m.Token({
                    key: args.text,
                    text: oText
                });
                return oNewToken;
            },
            
            tokenChange: function (oEvent) {
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

            createInitialButtons: function () {
                let oCodeButton = new sap.m.Button({
                    text: "Add new codeeditor",
                    icon: "sap-icon://source-code",
                });

                let oTextButton = new sap.m.Button({
                    text: "Add new textbox",
                    icon: "sap-icon://text",
                });

                this.getView().byId("buttonContainerId").insertItem(oTextButton);
                this.getView().byId("buttonContainerId").insertItem(oCodeButton);

                oCodeButton.attachPress((oEvent) => {
                    //Index start at 0
                    this.onCreateNewContent(oEvent, 0, "Code")
                }
                );

                oTextButton.attachPress((oEvent) => {
                    //Index start at 0
                    this.onCreateNewContent(oEvent, 0, "Richtext")
                }
                );
            },

            discardProgress: function () {
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
                let oContainer = this.getView().byId("buttonContainerId");
                this.getView().byId("wizardVBoxId").removeAllItems();
                oContainer.destroyItems();
                oWizard.discardProgress(oFirstStep);
                oWizard.goToStep(oFirstStep);

                this.getView().byId("multiInputId").removeAllTokens();
                this.getView().byId("newArticleWizard").invalidateStep(this.getView().byId("TitleStep"));
                this.getView().byId("newArticleWizard").invalidateStep(this.getView().byId("ContentStep"));
                this.getView().byId("descriptionId").setValue("");
                this.getView().byId("articleTitleId").setValue("");
                this.createInitialButtons();
                this._iOrderIndex = 0;
            },

            deleteContent: function (oEvent, oContext) {
                let oId = oEvent.getSource().sId.slice(10, 23);
                let oView = this.getView();
                let oElementsArr = oView.byId("wizardVBoxId");
                let oElement = oElementsArr.getItems();

                for (let x = 0; x < oElement.length; x++) {
                    //If Id contains oDate, remove from view
                    if (oElement[x].sId.includes(oId)) {
                        oElementsArr.removeItem(oElement[x]);
                        oContext.delete();
                    }
                };
                //Get new length of oElementsArr
                let newElementsArr = oElementsArr.getItems();
                //Check if there are any elements left, if no, show the two creation buttons
                newElementsArr.length === 0 ? this.createInitialButtons() : ""
            },

            onCreateNewContent: function (oEvent, contentIndex, type) {
                let oOuterBox = this.getView().byId("wizardVBoxId");
                let oDate = Date.now();
                let oView = this.getView();
                let oContainer = oView.byId("buttonContainerId");
                let oModel = this.getView().getModel();
                let iNextIndex = contentIndex + 1;
                let oVBoxContent = oOuterBox.getItems();

                // Loop over container items and update the create buttons to pass new index
                for (let x = 0; x < oVBoxContent.length; x++) {
                    //Get items for either richtext or code
                    let aItems = oVBoxContent[x].getItems();
                    console.log(aItems);
                    if (oVBoxContent[x].sId.includes("code")) {
                        //In case of updating codeeditor buttons
                        this.handleButtonUpdate(aItems, true, contentIndex); // Pass `true` for CodeEditor
                    } else {
                        //In case of updating richtext buttons
                        this.handleButtonUpdate(aItems, false, contentIndex); // Pass `false` for RichText
                    }
                };

                //Destroy original two buttons
                oContainer.destroyItems();

                if (type === "Richtext") { //create new richtext
                    //Creating context here ensures that the OrderIndex value can be updated dynamically
                    let oContext = oModel.createEntry(this._sPath + "/to_contentValue", {
                        properties: { ContentValue: "", OrderIndex: contentIndex, ArticleGuID: "" }
                    });

                    let oButtonHBox = new sap.m.HBox();

                    let oTextVBox = new sap.m.VBox({
                        //id affects handleWizardSubmit 
                        id: "rich" + oDate + contentIndex
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

                    oRichTextButton.attachPress((oEvent) => {
                        //Pass next index number with button
                        this.onCreateNewContent(oEvent, iNextIndex, "Richtext");
                    });

                    oCodeButton.attachPress(function () {
                        //Pass next index number with button
                        this.onCreateNewContent(oEvent, iNextIndex, "Code");
                    }, this)

                    let oRichText = new RichTextEditor({
                        width: "100%",
                        height: "450px",
                        showGroupFont: true,
                        value: "{ContentValue}"
                    });

                    oDeleteButton.attachPress((oEvent) => {
                        this.deleteContent(oEvent, oContext);
                    });

                    oRichText.setBindingContext(oContext);
                    oTextVBox.addStyleClass("sapUiLargeMarginBottom");
                    oTextVBox.insertItem(oRichText, 0);
                    oTextVBox.insertItem(oButtonHBox, 1);
                    oButtonHBox.insertItem(oDeleteButton);
                    oButtonHBox.insertItem(oRichTextButton);
                    oButtonHBox.insertItem(oCodeButton);
                    this.getView().byId("wizardVBoxId").insertItem(oTextVBox);
                }

                else { //create new codeeditor
                    //Creating context here ensures that the OrderIndex value can be updated dynamically
                    let oContext = oModel.createEntry(this._sPath + "/to_codeValue", {
                        properties: { CodeValue: "", CodeType: "", OrderIndex: contentIndex, ArticleGuID: "" }
                    });

                    let oTextVBox = new sap.m.VBox({
                        //id affects handleWizardSubmit 
                        id: "code" + oDate + contentIndex
                    });

                    let oButtonHBox = new sap.m.HBox();

                    let oCode = new sap.m.ComboBox({
                        id: "CodeTypeId" + oDate + contentIndex,
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
                    let oJsonModel = new sap.ui.model.json.JSONModel(sap.ui.require.toUrl("articlesfreestyle/model/codecollection.json"));
                    oJsonModel.setSizeLimit(160);
                    oCode.setModel(oJsonModel);

                    let oEditor = new CodeEditor({
                        width: "100%",
                        height: "450px",
                        value: "{CodeValue}",
                        type: "{CodeType}",
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

                    oRichTextButton.attachPress(function (oEvent) {
                        this.onCreateNewContent(oEvent, iNextIndex, "Richtext");
                    }, this)

                    oCodeButton.attachPress(function (oEvent) {
                        this.onCreateNewContent(oEvent, iNextIndex, "Code");
                    }, this)

                    oDeleteButton.attachPress((oEvent) => {
                        this.deleteContent(oEvent, oContext)
                    });

                    oTextVBox.setBindingContext(oContext);
                    oTextVBox.addStyleClass("sapUiLargeMarginBottom");
                    oTextVBox.insertItem(oButtonHBox);
                    oTextVBox.insertItem(oEditor);
                    oTextVBox.insertItem(oCode);
                    oButtonHBox.insertItem(oDeleteButton);
                    oButtonHBox.insertItem(oRichTextButton);
                    oButtonHBox.insertItem(oCodeButton);
                    this.getView().byId("wizardVBoxId").insertItem(oTextVBox);
                }

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

            // Helper function to decide if richtext or codeeditor buttons need to be updated
            handleButtonUpdate: function (aItems, isCodeEditor, buttonIndex) {
                //aItems are the outer VBoxcontainer items (either richtext-container or codeeditor-container)
                let iItemIndex = aItems[isCodeEditor ? 1 : 0].getBindingContext().getProperty('OrderIndex');

                if (buttonIndex <= iItemIndex) {
                    let iCurrentIndex = iItemIndex + 1;
                    //Depending on the editor either aItems[1] = codeeditor, or aItems[0] = richtexteditor
                    let sBindingPath = aItems[isCodeEditor ? 1 : 0].getBindingContext().getPath();
                    aItems[isCodeEditor ? 1 : 0].getBindingContext().getModel().setProperty(sBindingPath + '/OrderIndex', iCurrentIndex);

                    //Depending on the editor access HBox for buttons 
                    let aHBox = aItems[isCodeEditor ? 2 : 1];
                    aHBox.getItems()[1].destroy();
                    aHBox.getItems()[0].destroy();

                    let oNewCodeButton = new sap.m.Button({
                        text: "Add new codeeditor",
                        icon: "sap-icon://source-code",
                        id: "CodeEditor" + Date.now() + iCurrentIndex
                    });

                    let oNewRichTextButton = new sap.m.Button({
                        text: "Add new textbox",
                        icon: "sap-icon://text",
                        id: "RichText" + Date.now() + iCurrentIndex
                    });

                    aHBox.insertItem(oNewCodeButton, 0);
                    aHBox.insertItem(oNewRichTextButton, 1);

                    oNewCodeButton.attachPress((oEvent) => {
                        //Pass next index number with button
                        this.onCreateNewContent(oEvent, iCurrentIndex + 1, "Code");
                    });

                    oNewRichTextButton.attachPress((oEvent) => {
                        //Pass next index number with button
                        this.onCreateNewContent(oEvent, iCurrentIndex + 1, "Richtext");
                    })
                }
            },


            //----------------- Submit function  -------------------------
            handleWizardSubmit: function () {
                let oValidFirstStep = this.validateArticleWizard();
                let oVBoxContent = this.getView().byId("wizardVBoxId").getItems();
                const allTokens = this.getView().byId("multiInputId").getTokens();
                const tokenTextArr = [];
                let aContent = [];
                let aCode = [];


                for (let x = 0; x < oVBoxContent.length; x++) {
                    let oContentId = oVBoxContent[x].getId();
                    //Select Richtext editors from VBox items
                    if (oContentId.includes("rich")) {

                        let oTextItems = oVBoxContent[x].getItems();
                        let oRichContext = oTextItems[0].getBindingContext()
                        let iIndex = oRichContext.getProperty('OrderIndex');
                        let sContent = oRichContext.getProperty('ContentValue');
                        //push to array as 2. array to keep them together
                        aContent.push([sContent, iIndex]);
                        //Delete first binding context to make sure it doesn`t generate errors
                        oRichContext.delete();

                        //Select codeEditor + type from VBox items
                    } else if (oContentId.includes("code")) {
                        let oCodeItems = oVBoxContent[x].getItems();
                        let type = oCodeItems[1].getType();
                        let code = oCodeItems[1].getValue();
                        let oCodeContext = oCodeItems[1].getBindingContext();
                        let iIndex = oCodeContext.getProperty('OrderIndex');

                        //push to array as 2. array to keep them together
                        aCode.push([type, code, iIndex]);
                        //Delete first binding context to make sure it doesn`t generate errors
                        oCodeContext.delete();
                    }
                }

                //get the text of each tokens
                for (let x = 0; x < allTokens.length; x++) {
                    const tokenText = allTokens[x].getText();
                    tokenTextArr.push(tokenText);
                };

                //Validation
                if (oValidFirstStep === false) {
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
                        for (let y = 0; y < aCode.length; y++) {
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
        },
        );
    });
