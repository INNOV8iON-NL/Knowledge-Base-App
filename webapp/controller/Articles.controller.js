sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/FormattedText",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/ui/codeeditor/CodeEditor",
    "sap/m/VBox",
    "sap/m/Tokenizer"
],
    function (Controller, FormattedText, MessageToast, RichTextEditor, CodeEditor, VBox, Tokenizer) {
        "use strict";

        return Controller.extend("articlesfreestyle.controller.Articles", {

            //Variable for checking if editing mode is active
            _isEditing: "",

            onInit: function () {
                var oRouter = this.getRouter();

                oRouter.getRoute("articles").attachMatched(this._onObjectMatched, this);

                //Array to collect items to be deleted
                this.itemsToDelete = [];
                this._oMultiInput = this.getView().byId("multiInputId2");
                this._oMultiInput.addValidator(this._multiInputValidator.bind(this._oMultiInput))
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
                this.getView().byId("CategoryList").setVisible(true);
                this.getView().byId("multiInputId2").setVisible(false);
                this._isEditing = false;
                this.getView().getModel().resetChanges();
            },

            _onBindingChange: function () {
                var oElementBinding;

                oElementBinding = this.getView().getElementBinding();
                //No data for the binding
                if (oElementBinding && !oElementBinding.getBoundContext()) {
                    this.getRouter().getTargets().display("notFound");
                }
            },

            //----------------- Edit functions ------------------------- 

            onEdit: function () {
                const oMultiInput = this.getView().byId("multiInputId2");
                this.getView().byId("descText").setVisible(false);
                this.getView().byId("descValue").setVisible(true);
                this.getView().byId("titleContainer").setVisible(true);
                this.getView().byId("editButton").setVisible(false);
                this.getView().byId("saveButton").setVisible(true);
                this.getView().byId("cancelButton").setVisible(true);
                this.getView().byId("CategoryList").setVisible(false);
                oMultiInput.setVisible(true);
                let oTokens = oMultiInput.getTokens();
                this.renderEditControls();
                this._isEditing = true;
            },

            _multiInputValidator: function (args) {
                let oText = args.text.toUpperCase();
                let oNewToken = new sap.m.Token({
                    key: args.text,
                    text: oText
                });

                return oNewToken;
            },


            _onTokenUpdate: function (oEvent) {
                var aTokens,
                    sTokensText = "",
                    i;

                if (oEvent.getParameter('type') === Tokenizer.TokenUpdateType.Added) {
                    aTokens = oEvent.getParameter('addedTokens');

                    for (i = 0; i < aTokens.length; i++) {
                        sTokensText = aTokens[i].getText();
                        let oContext = this.getView().getModel().createEntry("/Tags", {
                            properties: { TagName: sTokensText, ArticleguID: this._sArticleId }
                        });
                        this._oMultiInput.setBindingContext(oContext);
                    }

                } else if (oEvent.getParameter('type') === Tokenizer.TokenUpdateType.Removed) {
                    aTokens = oEvent.getParameter('removedTokens');
                    for (i = 0; i < aTokens.length; i++) {
                        if (aTokens[i].sId.includes("tag")) {
                            console.log(aTokens[i].sId.slice(3, 39));
                            this.getView().getModel().remove(`/Tags(guid'${aTokens[i].sId.slice(3, 39)}')`);
                        } else {
                            const oContext = oEvent.getSource().getBindingContext();
                            oContext.delete();
                        }
                    }
                }
            },

            onSaveChanges: function (oEvent) {
                let requiredInputs = this.returnIdListOfRequiredFields();
                let passedValidation = this.validateEventFeedbackForm(requiredInputs);

                if (!passedValidation) {
                    // Show an error message, rest of code will not execute.
                    return false;
                }

                this.getView().getModel().submitChanges({
                    success: function (oData) {
                        sap.m.MessageBox.success("Article was updated.", {
                            onClose: function () {
                                //Refresh window so modifications appear
                                window.location.reload();
                            }
                        });
                    }.bind(this),
                    error: function (oData) {
                        console.log("Something went wrong.");
                    }.bind(this)
                });
            },

            returnIdListOfRequiredFields: function () {
                let requiredInputs;
                return requiredInputs = ['titleValue', 'descValue'];
            },
            validateEventFeedbackForm: function (requiredInputs) {
                let _self = this;
                let valid = true;

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
                return valid;
            },

            //----------------- Cancel edit ------------------------- 

            onBeforeCancel: function () {
                let that = this;
                sap.m.MessageBox.warning("All modifications will be discarded. Continue?", {
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction: sap.m.MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction == "OK") {
                            that.onCancel();
                        } else {
                            return;
                        }
                    }
                });
            },

            onCancel: function (oEvent) {
                let sMainPath = this.getView().getModel().createKey("Articles", {
                    GuID: this.getView().getBindingContext().getObject().GuID
                });
                let sContentPath = "/" + sMainPath + "/to_contentValue";
                let sCodePath = "/" + sMainPath + "/to_codeValue";
                let oMultiInput = this.getView().byId("multiInputId2");
                let oTokens = oMultiInput.getTokens();

                this.getView().byId("descText").setVisible(true);
                this.getView().byId("descValue").setVisible(false);
                this.getView().byId("titleContainer").setVisible(false);
                this.getView().byId("titleValue").setValueState("None");
                this.getView().byId("descValue").setValueState("None");
                this.getView().byId("editButton").setVisible(true);
                this.getView().byId("saveButton").setVisible(false);
                this.getView().byId("cancelButton").setVisible(false);
                this.getView().byId("CategoryList").setVisible(true);
                oMultiInput.setVisible(false);

                this._isEditing = false;

                //Remove all the tokens that could be leftover after the previous editing
                for (let x = 0; x < oTokens.length; x++) {
                    if (!oTokens[x].sId.includes('tag')) {
                        oMultiInput.removeToken(oTokens[x]);
                    }
                }
                this.renderDisplayControls(sContentPath, sCodePath);

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


            renderDisplayControls: function (sContentPath, sCodePath) {
                let oView = this.getView();
                oView.byId("articleContent").removeAllItems();

                // Create two promises for the OData calls
                let promise1 = new Promise((resolve, reject) => {
                    this.getView().getModel().read(sCodePath, {
                        success: function (oData) {
                            resolve(oData.results);  // Resolve with the result of the first call
                        },
                        error: function (oError) {
                            reject(oError);  // Reject if there's an error
                        }
                    });
                });

                let promise2 = new Promise((resolve, reject) => {
                    this.getView().getModel().read(sContentPath, {
                        success: function (oData) {
                            resolve(oData.results);  // Resolve with the result of the second call
                        },
                        error: function (oError) {
                            reject(oError);  // Reject if there's an error
                        }
                    });
                });

                // Use Promise.all to wait for both promises to resolve
                Promise.all([promise1, promise2]).then(([oCodeData, oContentData]) => {
                    // Merge the data based on OrderIndex
                    let combinedData = [...oCodeData, ...oContentData];

                    // Sort combined data by OrderIndex
                    combinedData.sort((a, b) => a.OrderIndex - b.OrderIndex);

                    //Loop through the sorted combined data and insert items
                    combinedData.forEach((data) => {
                        if (data.hasOwnProperty('CodeValue')) {  // If this is from the code data

                            let oType = new sap.m.ComboBox({
                                editable: false,
                                value: "{CodeType}"
                            });

                            let oEditor = new sap.ui.codeeditor.CodeEditor({
                                value: "{CodeValue}",
                                type: "{CodeType}",
                                editable: false,
                                width: "100%",
                                height: "300px"
                            });

                            const sCodePath = this.getView().getModel().createKey("CodeValue", {
                                GuID: data.GuID,
                                ArticleGuID: data.ArticleGuID
                            });

                            oType.bindElement("/" + sCodePath);
                            oEditor.bindElement("/" + sCodePath);

                            let oCodeVBox = new VBox({});

                            oCodeVBox.removeStyleClass("sapUiContentPadding");
                            oCodeVBox.addStyleClass("sapUiLargeMarginBottom");
                            oCodeVBox.insertItem(oEditor);
                            oCodeVBox.insertItem(oType);

                            let iOrderIndex = data.OrderIndex;
                            this.getView().byId("articleContent").insertItem(oCodeVBox, iOrderIndex);

                        } else if (data.hasOwnProperty('ContentValue')) {
                            let oContentVBox = new VBox({
                            });

                            let oFormattedText = new sap.m.FormattedText({
                                htmlText: "{ContentValue}",
                                width: "100%"
                            });

                            const sContentPath = this.getView().getModel().createKey("ContentValue", {
                                GuID: data.GuID,
                                ArticleGuID: data.ArticleGuID
                            });

                            oFormattedText.bindElement("/" + sContentPath);

                            oContentVBox.insertItem(oFormattedText);

                            let iOrderIndex = data.OrderIndex;
                            this.getView().byId("articleContent").insertItem(oContentVBox, iOrderIndex);
                        }
                    });
                }).catch((error) => {
                    console.log("Error fetching data:", error);
                });
            },

            deleteFromButton: function (oEvent, articleGuID, itemToDelete) {
                let oVBoxContainer = this.getView().byId("articleContent");
                let that = this;
                let sId = oEvent.getSource().getId().slice(14);

                sap.m.MessageBox.warning("This action can`t be reversed. Continue?", {
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction: sap.m.MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction == "OK") {
                            let deletePath;
                            if (itemToDelete === "Richtext") {
                                deletePath = `/ContentValue(GuID=guid'${sId}',ArticleGuID=guid'${articleGuID}')`;
                            } else if (itemToDelete === "Code") {
                                deletePath = `/CodeValue(GuID=guid'${sId}',ArticleGuID=guid'${articleGuID}')`;
                            }
                            that.getView().getModel().remove(deletePath);

                            //remove items from frontend view as well 
                            let oVBoxes = oVBoxContainer.getItems();
                            for (let x = 0; x < oVBoxes.length; x++) {
                                let oInnerVBox = oVBoxes[x].getItems();

                                for (let y = 0; y < oInnerVBox.length; y++) {
                                    if (oInnerVBox[y].sId.includes(sId)) {
                                        oVBoxContainer.removeItem(oVBoxes[x]);
                                    }
                                }
                            }

                            //Get new length of oElementsArr
                            let newElementsArr = oVBoxContainer.getItems();
                            //Check if there are any elements left
                            newElementsArr.length === 0 ? this.createInitialButtons() : ""
                        } else {
                            return;
                        }
                    }
                });
            },

            deleteNewContent: function (oContext, sVBoxId) {
                let oContainer = this.getView().byId("articleContent");
                let oVBoxes = oContainer.getItems();

                for (let x = 0; x < oVBoxes.length; x++) {
                    if (oVBoxes[x].sId.includes(sVBoxId)) {
                        //remove vbox from frontend
                        oContainer.removeItem(oVBoxes[x]);
                    }
                }
                //Newly created context is deleted, so it won`t be sent to the backend
                oContext.delete();

                //Get new length of oElementsArr
                let newElementsArr = oContainer.getItems();
                //Check if there are any elements left
                newElementsArr.length === 0 ? this.createInitialButtons() : ""
            },

            createInitialButtons: function () {
                let oContainer = this.getView().byId("articleContent");
                let sArticleGuID = this._sArticleId;

                let oButtonBox = new sap.m.HBox({
                    id: "oButtonBox" + Date.now()
                });

                let oCodeButton = new sap.m.Button({
                    text: "Add new codeeditor",
                    icon: "sap-icon://source-code",
                    id: "CodeEditor" + Date.now()
                });

                let oTextButton = new sap.m.Button({
                    text: "Add new textbox",
                    icon: "sap-icon://text",
                    id: "RichText" + Date.now()
                });

                oButtonBox.insertItem(oTextButton);
                oButtonBox.insertItem(oCodeButton);
                oContainer.insertItem(oButtonBox);

                oCodeButton.attachPress((oEvent) => {
                    //Index start at 0
                    this.createNewContent(oEvent, 0, sArticleGuID)
                }
                );

                oTextButton.attachPress((oEvent) => {
                    //Index start at 0
                    this.createNewContent(oEvent, 0, sArticleGuID)
                }
                );
            },


            createNewContent: function (oEvent, OrderIndex, ArticleGuID) {
                let articleContent = this.getView().byId("articleContent");
                let aContainerItems = articleContent.getItems(); //gets richtext & codeeditor containers
                let oModel = this.getView().getModel();

                //Delete empty page create buttons if they are active
                aContainerItems.forEach((vbox) => {
                    if (vbox.sId.includes("oButtonBox")) {
                        vbox.destroyItems();
                    }
                });

                // Loop over container items and update the create buttons
                for (let x = 0; x < aContainerItems.length; x++) {
                    //Get items for either richtext or codeeditor
                    let aItems = aContainerItems[x].getItems();
                    if (aContainerItems[x].sId.includes("CodeEditor")) {
                        //In case of updating codeeditor buttons
                        this.handleContentCreation(aItems, OrderIndex, true, ArticleGuID); // Pass `true` for CodeEditor
                    } else if (aContainerItems[x].sId.includes("RichText")) {
                        //In case of updating richtext buttons
                        this.handleContentCreation(aItems, OrderIndex, false, ArticleGuID); // Pass `false` for RichText
                    }

                }
                //Create new codeeditor
                if (oEvent.getSource().sId.includes("CodeEditor")) {
                    let oType = new sap.m.ComboBox({
                        id: "c" + Date.now(),
                        items: {
                            //template is based on codecollection.json
                            path: "/codeCollection",
                            template: new sap.ui.core.Item({
                                key: "{key}",
                                text: "{code}"
                            })
                        }
                    });

                    let oJsonModel = new sap.ui.model.json.JSONModel(sap.ui.require.toUrl("articlesfreestyle/model/codecollection.json"));
                    oJsonModel.setSizeLimit(160);
                    oType.setModel(oJsonModel);

                    let oEditor = new sap.ui.codeeditor.CodeEditor({
                        value: "{CodeValue}",
                        type: "{CodeType}",
                        editable: true,
                        width: "100%",
                        height: "300px",
                        //Date.now is important to ensure unique ids
                        id: "c" + Date.now()
                    });

                    let newOrderIndex = OrderIndex + 1;
                    let sVBoxId = "CodeEditor" + Date.now()

                    let oCodeVBox = new VBox({
                        id: sVBoxId
                    });

                    let oContext = oModel.createEntry("/Articles(guid'" + ArticleGuID + "')" + "/to_codeValue", {
                        properties: { CodeValue: "", CodeType: "", OrderIndex: newOrderIndex, ArticleGuID: ArticleGuID }
                    });

                    oEditor.setBindingContext(oContext);
                    oType.setBindingContext(oContext);

                    oCodeVBox.addStyleClass("sapUiLargeMarginBottom");

                    let oButtonHBox = new sap.m.HBox();

                    let oCodeDelete = new sap.m.Button({
                        text: "Delete codeeditor",
                        icon: "sap-icon://delete",
                        //Date.now is important to ensure unique ids
                        id: "b" + Date.now() + newOrderIndex
                    });

                    let oNewCodeButton = new sap.m.Button({
                        text: "Add new codeeditor",
                        icon: "sap-icon://source-code",
                        id: "CodeEditor" + Date.now() + newOrderIndex
                    });

                    let oNewRichTextButton = new sap.m.Button({
                        text: "Add new textbox",
                        icon: "sap-icon://text",
                        id: "RichText" + Date.now() + newOrderIndex
                    });

                    oType.attachSelectionChange(function (oEvent) {
                        let sCodeType = oType.getValue();
                        this.getView().getModel().setProperty(oContext.getPath() + "/CodeType", sCodeType);
                    }, this);

                    oButtonHBox.insertItem(oCodeDelete);
                    oButtonHBox.insertItem(oNewRichTextButton);
                    oButtonHBox.insertItem(oNewCodeButton);
                    oCodeVBox.insertItem(oButtonHBox);
                    oCodeVBox.insertItem(oEditor);
                    oCodeVBox.insertItem(oType);
                    articleContent.insertItem(oCodeVBox, newOrderIndex);

                    oCodeDelete.attachPress(function () {
                        //Newly created boxes have a different delete function than original boxes
                        this.deleteNewContent(oContext, sVBoxId)
                    }, this);

                    oNewCodeButton.attachPress(function (oEvent) {
                        this.createNewContent(oEvent, newOrderIndex, ArticleGuID);
                    }, this);

                    oNewRichTextButton.attachPress(function (oEvent) {
                        this.createNewContent(oEvent, newOrderIndex, ArticleGuID);
                    }, this)
                }

                //Create new richtext
                else if (oEvent.getSource().sId.includes("RichText")) {
                    let oRichText = new sap.ui.richtexteditor.RichTextEditor({
                        width: "100%",
                        height: "300px",
                        showGroupFont: true,
                        id: "RichtextToSend" + Date.now(),
                        value: "{ContentValue}"
                    });

                    let newOrderIndex = OrderIndex + 1;

                    let sVBoxId = "RichText" + Date.now()

                    let oContentVBox = new VBox({
                        id: sVBoxId
                    });

                    //Create entry for new content
                    let oContext = oModel.createEntry("/Articles(guid'" + ArticleGuID + "')" + "/to_contentValue", {
                        properties: { ContentValue: "", OrderIndex: newOrderIndex, ArticleGuID: ArticleGuID }
                    });

                    oRichText.setBindingContext(oContext);

                    let sNewPath = oRichText.getBindingContext().getPath();

                    oContentVBox.insertItem(oRichText);

                    let oButtonHBox = new sap.m.HBox();
                    let sNewId = oRichText.getBindingContext().getPath();

                    let oContentDelete = new sap.m.Button({
                        text: "Delete textbox",
                        icon: "sap-icon://delete",
                        //Date.now is important to ensure unique ids
                        id: "b" + Date.now() + sNewId.slice(15, 34)
                    });

                    let oNewCodeButton = new sap.m.Button({
                        text: "Add new codeeditor",
                        icon: "sap-icon://source-code",
                        id: "CodeEditor" + Date.now() + newOrderIndex
                    });

                    let oNewContentButton = new sap.m.Button({
                        text: "Add new textbox",
                        icon: "sap-icon://text",
                        id: 'newButton' + Date.now() + "RichText" + newOrderIndex
                    });

                    oContentVBox.addStyleClass("sapUiLargeMarginBottom");
                    oButtonHBox.insertItem(oContentDelete);
                    oButtonHBox.insertItem(oNewContentButton);
                    oButtonHBox.insertItem(oNewCodeButton);
                    oContentVBox.insertItem(oRichText);
                    oContentVBox.insertItem(oButtonHBox, 1);

                    articleContent.insertItem(oContentVBox, newOrderIndex);

                    oContentDelete.attachPress(function () {
                        //Newly created boxes have a different delete function than original boxes
                        this.deleteNewContent(oContext, sVBoxId);
                    }, this);

                    oNewContentButton.attachPress(function (oEvent) {
                        this.createNewContent(oEvent, newOrderIndex, ArticleGuID);
                    }, this);

                    oNewCodeButton.attachPress(function (oEvent) {
                        this.createNewContent(oEvent, newOrderIndex, ArticleGuID);
                    }, this);
                }

                //Get all outer VBox items
                let newVBox = articleContent.getItems(); //vboxes for richtext and code

                //Sort in ascending order
                newVBox.sort(function (vbox1, vbox2) {
                    // Check if vbox1 and vbox2 have items, then if it`s a richtext vbox, look for first item, if codeeditor vbox look for second
                    let oItem1 = (vbox1.getItems().length > 0) ? (vbox1.sId.includes("RichText") ? vbox1.getItems()[0] : vbox1.getItems()[1]) : null;
                    let oItem2 = (vbox2.getItems().length > 0) ? (vbox2.sId.includes("RichText") ? vbox2.getItems()[0] : vbox2.getItems()[1]) : null;

                    // Ensure both items exist and have a binding context
                    if (oItem1 && oItem2 && oItem1.getBindingContext() && oItem2.getBindingContext()) {
                        let itemOrderIndex1 = oItem1.getBindingContext().getProperty('OrderIndex');
                        let itemOrderIndex2 = oItem2.getBindingContext().getProperty('OrderIndex');
                        return itemOrderIndex1 - itemOrderIndex2;
                    } else {
                        return 0;
                    }
                })

                articleContent.removeAllItems();  // Clear all items first
                newVBox.forEach(function (vbox) {
                    articleContent.addItem(vbox);  // Add items back in sorted order
                });
            },

            // Helper function to decide if richtext or codeeditor buttons need to be updated
            handleContentCreation: function (aItems, OrderIndex, isCodeEditor, ArticleGuID) {
                //aItems are the outer VBoxcontainer items (either richtext-container or codeeditor-container)
                let iItemIndex = aItems[isCodeEditor ? 1 : 0].getBindingContext().getProperty('OrderIndex');


                if (OrderIndex < iItemIndex) {
                    iItemIndex += 1;
                    //Depending on the editor either aItems[1] = codeeditor, or aItems[0] = richtexteditor
                    let sBindingPath = aItems[isCodeEditor ? 1 : 0].getBindingContext().getPath();
                    aItems[isCodeEditor ? 1 : 0].getBindingContext().getModel().setProperty(sBindingPath + '/OrderIndex', iItemIndex);

                    //Depending on the editor access HBox for buttons 
                    let aHBox = aItems[isCodeEditor ? 2 : 1];
                    aHBox.getItems()[1].destroy();
                    aHBox.getItems()[0].destroy();

                    let oNewCodeButton = new sap.m.Button({
                        text: "Add new codeeditor",
                        icon: "sap-icon://source-code",
                        id: "CodeEditor" + Date.now() + iItemIndex
                    });

                    let oNewRichTextButton = new sap.m.Button({
                        text: "Add new textbox",
                        icon: "sap-icon://text",
                        id: "RichText" + Date.now() + iItemIndex
                    });

                    aHBox.insertItem(oNewCodeButton, 0);
                    aHBox.insertItem(oNewRichTextButton, 1);

                    oNewCodeButton.attachPress((oEvent) => {
                        this.createNewContent(oEvent, iItemIndex, ArticleGuID);
                    });

                    oNewRichTextButton.attachPress((oEvent) => {
                        this.createNewContent(oEvent, iItemIndex, ArticleGuID);
                    });
                }
            },

            renderEditControls: function () {
                let oView = this.getView();
                oView.byId("articleContent").removeAllItems();

                let sCodePath = "/Articles(guid'" + this._sArticleId + "')" + "/to_codeValue"
                let sContentPath = "/Articles(guid'" + this._sArticleId + "')" + "/to_contentValue"
                let sTagPath = "/Articles(guid'" + this._sArticleId + "')" + "/to_tags"


                // Create two promises for the OData calls
                let promise1 = new Promise((resolve, reject) => {
                    this.getView().getModel().read(sCodePath, {
                        success: function (oData) {
                            resolve(oData.results);  // Resolve with the result of the first call
                        },
                        error: function (oError) {
                            reject(oError);  // Reject if there's an error
                        }
                    });
                });

                let promise2 = new Promise((resolve, reject) => {
                    this.getView().getModel().read(sContentPath, {
                        success: function (oData) {
                            resolve(oData.results);  // Resolve with the result of the second call
                        },
                        error: function (oError) {
                            reject(oError);  // Reject if there's an error
                        }
                    });
                });

                let promise3 = new Promise((resolve, reject) => {
                    this.getView().getModel().read(sTagPath, {
                        success: function (oData) {
                            resolve(oData.results);  // Resolve with the result of the first call
                        },
                        error: function (oError) {
                            reject(oError);  // Reject if there's an error
                        }
                    });
                });


                // Use Promise.all to wait for both promises to resolve
                Promise.all([promise1, promise2, promise3]).then(([oCodeData, oContentData, oTagData]) => {
                    // Merge the data based on OrderIndex
                    let combinedData = [...oCodeData, ...oContentData];

                    //If there`s no content to be displayed, show two buttons that enable content creation
                    if (combinedData.length === 0) {
                        this.createInitialButtons();
                    }

                    // Sort combined data by OrderIndex
                    combinedData.sort((a, b) => a.OrderIndex - b.OrderIndex);

                    let aIndexes = [];

                    combinedData.map((data) => aIndexes.push(data.OrderIndex));

                    combinedData.forEach((data) => {
                        if (data.hasOwnProperty('CodeValue')) {  // If this is from the code data

                            let oType = new sap.m.ComboBox({
                                id: "c" + Date.now() + data.GuID,
                                items: {
                                    //template is based on codecollection.json
                                    path: "/codeCollection",
                                    template: new sap.ui.core.Item({
                                        key: "{key}",
                                        text: "{code}"
                                    })
                                }
                            });

                            let oJsonModel = new sap.ui.model.json.JSONModel(sap.ui.require.toUrl("articlesfreestyle/model/codecollection.json"));
                            oJsonModel.setSizeLimit(160);
                            oType.setModel(oJsonModel);

                            let oEditor = new sap.ui.codeeditor.CodeEditor({
                                value: "{CodeValue}",
                                type: "{CodeType}",
                                editable: true,
                                width: "100%",
                                height: "300px",
                                //Including GuID is important for function deleteFromButton
                                //Date.now is important to ensure unique ids
                                id: "c" + Date.now() + data.GuID
                            });

                            let oCodeDelete = new sap.m.Button({
                                text: "Delete codeeditor",
                                icon: "sap-icon://delete",
                                //Including GuID is important for function deleteFromButton
                                //Date.now is important to ensure unique ids
                                id: "b" + Date.now() + data.GuID,
                            });

                            let oNewCodeButton = new sap.m.Button({
                                text: "Add new codeeditor",
                                icon: "sap-icon://source-code",
                                id: 'b' + Date.now() + "CodeEditor" + data.GuID
                            });

                            let oNewRichTextButton = new sap.m.Button({
                                text: "Add new textbox",
                                icon: "sap-icon://text",
                                id: 'b' + Date.now() + "RichText" + data.GuID
                            });

                            const sCodePath = this.getView().getModel().createKey("CodeValue", {
                                GuID: data.GuID,
                                ArticleGuID: data.ArticleGuID
                            });

                            oType.bindElement("/" + sCodePath);
                            oEditor.bindElement("/" + sCodePath);

                            let oCodeVBox = new VBox({
                                //Date.now is important to ensure unique ids
                                id: "v" + Date.now() + data.GuID + "CodeEditor"
                            });

                            let oButtonHBox = new sap.m.HBox();

                            oType.setValue(data.CodeType);
                            oEditor.removeStyleClass("sapUiContentPadding");
                            oCodeVBox.addStyleClass("sapUiLargeMarginBottom");
                            oButtonHBox.insertItem(oCodeDelete);
                            oButtonHBox.insertItem(oNewRichTextButton);
                            oButtonHBox.insertItem(oNewCodeButton);
                            oCodeVBox.insertItem(oButtonHBox);
                            oCodeVBox.insertItem(oEditor);
                            oCodeVBox.insertItem(oType);

                            oCodeDelete.attachPress(function (oEvent) {
                                this.deleteFromButton(oEvent, data.ArticleGuID, "Code");
                            }, this);

                            oNewCodeButton.attachPress(function (oEvent) {
                                this.createNewContent(oEvent, data.OrderIndex, data.ArticleGuID);
                            }, this);

                            oNewRichTextButton.attachPress(function (oEvent) {
                                this.createNewContent(oEvent, data.OrderIndex, data.ArticleGuID);
                            }, this);

                            let iOrderIndex = data.OrderIndex;
                            this.getView().byId("articleContent").insertItem(oCodeVBox, data.OrderIndex);
                        }

                        else if (data.hasOwnProperty('ContentValue')) {  // If this is from the content data
                            let oContentVBox = new VBox({
                                //Date.now + OrderIndex is important to ensure unique ids
                                id: 'v' + Date.now() + data.OrderIndex + "RichText"
                            });

                            let oButtonHBox = new sap.m.HBox();

                            let oRichText = new sap.ui.richtexteditor.RichTextEditor({
                                value: "{ContentValue}",
                                width: "100%",
                                showGroupFont: true,
                                height: "300px",
                                id: "r" + Date.now() + data.GuID
                            });

                            const sContentPath = this.getView().getModel().createKey("ContentValue", {
                                GuID: data.GuID,
                                ArticleGuID: data.ArticleGuID
                            });

                            let oNewContentButton = new sap.m.Button({
                                text: "Add new textbox",
                                icon: "sap-icon://text",
                                id: 'b' + Date.now() + "RichText" + data.GuID
                            });

                            let oNewCodeButton = new sap.m.Button({
                                text: "Add new codeeditor",
                                icon: "sap-icon://source-code",
                                id: 'b' + Date.now() + "CodeEditor" + data.GuID
                            });

                            let oContentDelete = new sap.m.Button({
                                text: "Delete textbox",
                                icon: "sap-icon://delete",
                                //Including GuID is important for function deleteFromButton
                                //Date.now is important to ensure unique ids
                                id: "b" + Date.now() + data.GuID
                            });

                            oRichText.bindElement("/" + sContentPath);

                            oContentVBox.addStyleClass("sapUiLargeMarginBottom");
                            oButtonHBox.insertItem(oContentDelete);
                            oButtonHBox.insertItem(oNewContentButton);
                            oButtonHBox.insertItem(oNewCodeButton);
                            oContentVBox.insertItem(oButtonHBox);
                            oContentVBox.insertItem(oRichText);

                            oContentDelete.attachPress(function (oEvent) {
                                this.deleteFromButton(oEvent, data.ArticleGuID, "Richtext");
                            }, this);

                            oNewCodeButton.attachPress(function (oEvent) {
                                this.createNewContent(oEvent, data.OrderIndex, data.ArticleGuID);
                            }, this);

                            oNewContentButton.attachPress(function (oEvent) {
                                this.createNewContent(oEvent, data.OrderIndex, data.ArticleGuID);
                            }, this);

                            this.getView().byId("articleContent").insertItem(oContentVBox, data.OrderIndex);
                        }
                    });

                    oTagData.forEach((tag) => {
                        let oMultiInput = this.getView().byId("multiInputId2");
                        let originalToken = new sap.m.Token({ text: tag.TagName, id: "tag" + tag.GuID, key: tag.GuID });
                        oMultiInput.addToken(originalToken);

                        const sTagPath = this.getView().getModel().createKey("Tags", {
                            GuID: tag.GuID,
                            ArticleGuID: tag.ArticleGuID
                        });
                        originalToken.bindElement("/", sTagPath);
                    })

                }).catch((error) => {
                    console.log("Error fetching data:", error);
                });
            },
        });
    });

