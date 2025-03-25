sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/FormattedText",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/ui/codeeditor/CodeEditor",
    "sap/m/VBox"
],
    function (Controller, FormattedText, MessageBox, RichTextEditor, CodeEditor, VBox) {
        "use strict";

        return Controller.extend("articlesfreestyle.controller.Articles", {

            //Variable for checking if editing mode is active
            _isEditing: "",

            onInit: function () {
                var oRouter = this.getRouter();

                oRouter.getRoute("articles").attachMatched(this._onObjectMatched, this);

                //Array to collect items to be deleted
                this.itemsToDelete = [];
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
                //this._isValid = true;
                const sGuID = this.getView().getBindingContext().getObject().GuID;
                const sPath = `/Articles(guid'${sGuID}')`;
                let requiredInputs = this.returnIdListOfRequiredFields();
                let passedValidation = this.validateEventFeedbackForm(requiredInputs);
                let aContent = this.getView().byId("articleContent").getItems();

                if (passedValidation === false) {
                    //show an error message, rest of code will not execute.
                    return false;
                }

                //permanently remove items coming from deleteFromButton function 
                for (let y = 0; y < this.itemsToDelete.length; y++) {
                    if (this.itemsToDelete[y].itemToDelete === "Richtext") {
                        this.getView().getModel().remove("/ContentValue(GuID=guid'" + this.itemsToDelete[y].sId + "',ArticleGuID=guid'" + sGuID + "')");
                    } else if (this.itemsToDelete[y].itemToDelete === "Code") {
                        this.getView().getModel().remove("/CodeValue(GuID=guid'" + this.itemsToDelete[y].sId + "',ArticleGuID=guid'" + sGuID + "')");
                    }
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
                this.getView().getModel().submitChanges({
                    success: function (oData) {

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

                    // Now, loop through the sorted combined data and insert items
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
                let item = {
                    //slice everything from ID that is not the GuID
                    sId: oEvent.getSource().getId().slice(14),
                    articleGuID: articleGuID,
                    itemToDelete: itemToDelete
                }
                //push item to itemsToDelete for later use in onSaveChanges function
                this.itemsToDelete.push(item);

                //Slice everything from the ID that is not GuID
                let sContentId = oEvent.getSource().getId().slice(14);

                let oVBoxContainer = this.getView().byId("articleContent");
                let oVBoxes = oVBoxContainer.getItems();

                //only remove items from frontend view 
                for (let x = 0; x < oVBoxes.length; x++) {
                    let oInnerVBox = oVBoxes[x].getItems();
                    for (let y = 0; y < oInnerVBox.length; y++) {
                        if (oInnerVBox[y].sId.includes(sContentId)) {
                            oVBoxContainer.removeItem(oVBoxes[x]);
                        }
                    }
                }
            },

            deleteNewContent: function (oEvent, oContext) {
                let sItemId = oEvent.getSource().getId();
                let oContainer = this.getView().byId("articleContent");
                let oVBoxes = oContainer.getItems();

                for (let x = 0; x < oVBoxes.length; x++) {
                    let oInnerVBox = oVBoxes[x].getItems();
                    for (let y = 0; y < oInnerVBox.length; y++) {
                        if (oInnerVBox[y].sId.includes(sItemId)) {
                            //remove vbox from frontend
                            oContainer.removeItem(oVBoxes[x]);
                        }
                    }
                }
                //Newly created context is deleted, so it won`t be sent to the backend
                oContext.delete();
            },

            createNewContent: function (oEvent, OrderIndex, ArticleGuID) {
                let articleContent = this.getView().byId("articleContent");
                let aContainerItems = articleContent.getItems(); //gets richtext & codeeditor containers
                let oModel = this.getView().getModel();

                for (let x = 0; x < aContainerItems.length; x++) {
                    //Separate codeeditor
                    if (aContainerItems[x].sId.includes("CodeEditor")) {
                        let aCodeItems = aContainerItems[x].getItems();
                        //Get index of codeeditor
                        let iItemIndex = aCodeItems[1].getBindingContext().getProperty('OrderIndex');
                        if (OrderIndex < iItemIndex) {
                            iItemIndex += 1;
                            //Get path for codeeditor
                            let sBindingPath = aCodeItems[1].getBindingContext().getPath();
                            //Set new index for codeeditor
                            aCodeItems[1].getBindingContext().getModel().setProperty(sBindingPath + '/OrderIndex', iItemIndex)

                            //get hold of ButtonBox
                            let aHBox = aCodeItems[2];
                            //delete old create button
                            aHBox.getItems()[0].destroy();

                            //Recreate create button that stores the new itemindex
                            let oNewCreateButton = new sap.m.Button({
                                text: "Add NEW new codeeditor",
                                icon: "sap-icon://add",
                                id: 'oldButton' + Date.now() + "CodeEditor"
                            });

                            aHBox.insertItem(oNewCreateButton, 0);
                            oNewCreateButton.attachPress(function (oEvent) {
                                this.createNewContent(oEvent, iItemIndex, ArticleGuID);
                            }, this);
                        }
                    }
                    //Separate richtext
                    else {
                        let aContentItems = aContainerItems[x].getItems();
                        //Get index of richtext
                        let iItemIndex = aContentItems[0].getBindingContext().getProperty('OrderIndex');
                        if (OrderIndex < iItemIndex) {
                            iItemIndex += 1;
                            //Get path for richtext
                            let sBindingPath = aContentItems[0].getBindingContext().getPath();
                            //Set new index for richtext
                            aContentItems[0].getBindingContext().getModel().setProperty(sBindingPath + '/OrderIndex', iItemIndex)

                            //get hold of ButtonBox
                            let aHBox = aContentItems[1];
                            //delete old create button 
                            aHBox.getItems()[0].destroy();

                            //Recreate create button that stores the new itemindex
                            let oNewCreateButton = new sap.m.Button({
                                text: "Add NEW new richtext",
                                icon: "sap-icon://add",
                                id: 'oldButton' + Date.now() + "RichText"
                            });

                            aHBox.insertItem(oNewCreateButton, 0);
                            oNewCreateButton.attachPress(function (oEvent) {
                                this.createNewContent(oEvent, iItemIndex, ArticleGuID);
                            }, this);
                        }
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

                    let oJsonModel = new sap.ui.model.json.JSONModel();
                    oJsonModel.loadData("/model/codecollection.json");
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

                    let oCodeVBox = new VBox({
                        id: "CodeEditor" + Date.now()
                    });

                    let oContext = oModel.createEntry("/Articles(guid'" + ArticleGuID + "')" + "/to_codeValue", {
                        properties: { CodeValue: "", OrderIndex: newOrderIndex, ArticleGuID: ArticleGuID }
                    });

                    //Setting context on vbox is important for sorting
                    oCodeVBox.setBindingContext(oContext);
                    oEditor.setBindingContext(oContext);

                    let oButtonHBox = new sap.m.HBox();

                    let oCodeDelete = new sap.m.Button({
                        text: "Delete codeeditor",
                        icon: "sap-icon://delete",
                        //Date.now is important to ensure unique ids
                        id: "b" + Date.now()
                    });

                    let oNewCodeButton = new sap.m.Button({
                        text: "Add new codeeditor",
                        icon: "sap-icon://add",
                        id: 'newButton' + Date.now() + "CodeEditor"
                    });

                    oButtonHBox.insertItem(oCodeDelete);
                    oButtonHBox.insertItem(oNewCodeButton);
                    oCodeVBox.insertItem(oButtonHBox);
                    oCodeVBox.insertItem(oEditor);
                    oCodeVBox.insertItem(oType);
                    articleContent.insertItem(oCodeVBox, newOrderIndex);

                    oNewCodeButton.attachPress(function (oEvent) {
                        this.createNewContent(oEvent, newOrderIndex, ArticleGuID);
                    }, this);
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

                    let oContentVBox = new VBox({
                        id: "RichText" + Date.now()
                    });

                    //Create entry for new content
                    let oContext = oModel.createEntry("/Articles(guid'" + ArticleGuID + "')" + "/to_contentValue", {
                        properties: { ContentValue: "", OrderIndex: newOrderIndex, ArticleGuID: ArticleGuID }
                    });

                    //Setting context on vbox is important for sorting
                    oContentVBox.setBindingContext(oContext);
                    oRichText.setBindingContext(oContext);

                    let sNewPath = oRichText.getBindingContext().getPath();

                    oContentVBox.insertItem(oRichText);

                    let oButtonHBox = new sap.m.HBox();

                    let oContentDelete = new sap.m.Button({
                        text: "Delete textbox",
                        icon: "sap-icon://delete",
                        //Date.now is important to ensure unique ids
                        id: "b" + Date.now()
                    });

                    let oNewContentButton = new sap.m.Button({
                        text: "Add new textbox",
                        icon: "sap-icon://add",
                        id: 'newButton' + Date.now() + "RichText"
                    });

                    oButtonHBox.insertItem(oContentDelete);
                    oButtonHBox.insertItem(oNewContentButton);
                    oContentVBox.insertItem(oRichText);
                    oContentVBox.insertItem(oButtonHBox, 1);

                    articleContent.insertItem(oContentVBox, newOrderIndex);

                    oNewContentButton.attachPress(function (oEvent) {
                        this.createNewContent(oEvent, newOrderIndex, ArticleGuID);
                    }, this);
                }

                //Get all outer VBox items
                let newVBox = articleContent.getItems();

                //Sort in ascending order
                newVBox.sort(function (vbox1, vbox2) {
                    let itemOrderIndex1 = vbox1.getBindingContext().getProperty('OrderIndex');
                    let itemOrderIndex2 = vbox2.getBindingContext().getProperty('OrderIndex');

                    return itemOrderIndex1 - itemOrderIndex2;
                });
                articleContent.removeAllItems();  // Clear all items first
                newVBox.forEach(function (vbox) {
                    articleContent.addItem(vbox);  // Add items back in sorted order
                });
            },

            renderEditControls: function () {
                let oView = this.getView();
                oView.byId("articleContent").removeAllItems();

                let sCodePath = "/Articles(guid'" + this._sArticleId + "')" + "/to_codeValue"
                let sContentPath = "/Articles(guid'" + this._sArticleId + "')" + "/to_contentValue"


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

                            let oModel = new sap.ui.model.json.JSONModel();
                            oModel.loadData("/model/codecollection.json");
                            oModel.setSizeLimit(160);
                            oType.setModel(oModel);

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
                                icon: "sap-icon://add",
                                id: 'b' + Date.now() + "CodeEditor"
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

                            oEditor.removeStyleClass("sapUiContentPadding");
                            oCodeVBox.addStyleClass("sapUiLargeMarginBottom");
                            oButtonHBox.insertItem(oCodeDelete);
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
                                icon: "sap-icon://add",
                                id: 'b' + Date.now() + "RichText"
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
                            oContentVBox.insertItem(oButtonHBox);
                            oContentVBox.insertItem(oRichText);

                            oNewContentButton.attachPress(function (oEvent) {
                                this.createNewContent(oEvent, data.OrderIndex, data.ArticleGuID);
                            }, this);

                            oContentDelete.attachPress(function (oEvent) {
                                this.deleteFromButton(oEvent, data.ArticleGuID, "Richtext");
                            }, this);

                            this.getView().byId("articleContent").insertItem(oContentVBox, data.OrderIndex);
                        }
                    });
                }).catch((error) => {
                    console.log("Error fetching data:", error);
                });
            },
        });
    });


// aContainerVBox.forEach(function (vbox) {
//     let oItems = vbox.getItems(); //either richtext + buttonbox or type + codeeditor + buttonbox
//     let itemIndex = oItems[0].getBindingContext().getProperty('OrderIndex');
//     if (OrderIndex < itemIndex) {
//         let oDate = Date.now();
//         itemIndex += 1;
//Richtext
//         let sBindingPath = oItems[0].getBindingContext().getPath();
//         oItems[0].getBindingContext().getModel().setProperty(sBindingPath + '/OrderIndex', itemIndex);

//         let oHBox = oItems[1];
//         //Destroy old create button to get rid of itemIndex
//         oHBox.getItems()[0].destroy();

//         //Recreate buttons with updated itemIndex
//         let oReplaceContentButton = new sap.m.Button({
//             text: "Add new textbox",
//             icon: "sap-icon://add",
//             id: 'oldButton' + oDate
//         });

//         oHBox.insertItem(oReplaceContentButton, 0);
//         oReplaceContentButton.attachPress(function () {
//             this.createNewContent(itemIndex, ArticleGuID);
//         }, this);
//     }
// });


// let oRichText = new sap.ui.richtexteditor.RichTextEditor({
//     width: "100%",
//     height: "300px",
//     showGroupFont: true,
//     id: "RichtextToSend" + Date.now(),
//     value: "{ContentValue}"
// });

// let newOrderIndex = OrderIndex + 1;

// let oContentVBox = new VBox();
// oContentVBox.addStyleClass("sapUiLargeMarginBottom");

// let oModel = this.getView().getModel();

// //Create entry for new content
// let oContext = oModel.createEntry("/Articles(guid'" + ArticleGuID + "')" + "/to_contentValue", {
//     properties: { ContentValue: "", OrderIndex: newOrderIndex, ArticleGuID: ArticleGuID }
// });

// oContentVBox.setBindingContext(oContext);

// oRichText.setBindingContext(oContext);

// let sNewId = oRichText.getBindingContext().getPath();

// let oButtonHBox = new sap.m.HBox();

// let oContentDelete = new sap.m.Button({
//     text: "Delete textbox",
//     icon: "sap-icon://delete",
//     //Date.now is important to ensure unique ids
//     id: "b" + Date.now() + sNewId.slice(15, 34)
// });

// let oNewContentButton = new sap.m.Button({
//     text: "Add new textbox",
//     icon: "sap-icon://add",
//     id: 'newButton' + Date.now()
// });

// oNewContentButton.attachPress(function () {
//     this.createNewContent(newOrderIndex, ArticleGuID);
// }, this);

// oContentDelete.attachPress(function (oEvent) {
//     this.deleteNewContent(oEvent, oContext);
// }, this);

// oButtonHBox.insertItem(oContentDelete);
// oButtonHBox.insertItem(oNewContentButton);
// oContentVBox.insertItem(oButtonHBox);
// oContentVBox.insertItem(oRichText);

// articleContent.insertItem(oContentVBox, newOrderIndex);

// //Get all outer VBox items
// let newVBox = articleContent.getItems();

// //Sort in ascending order
// newVBox.sort(function (vbox1, vbox2) {
//     let oItem1 = vbox1.getItems()[0];
//     let oItem2 = vbox2.getItems()[0];

//     let itemOrderIndex1 = oItem1.getBindingContext().getProperty('OrderIndex');
//     let itemOrderIndex2 = oItem2.getBindingContext().getProperty('OrderIndex');

//     return itemOrderIndex1 - itemOrderIndex2;
// });
// articleContent.removeAllItems();  // Clear all items first
// newVBox.forEach(function (vbox) {
//     articleContent.addItem(vbox);  // Add items back in sorted order
// });