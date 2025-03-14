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
                //this._isValid = true;
                const sGuID = this.getView().getBindingContext().getObject().GuID;
                const sPath = `/Articles(guid'${sGuID}')`;
                let requiredInputs = this.returnIdListOfRequiredFields();
                let passedValidation = this.validateEventFeedbackForm(requiredInputs);
                let aContent = this.getView().byId("articleContent").getItems();
                let aCode = this.getView().byId("articleCode").getItems();

                if (passedValidation === false) {
                    //show an error message, rest of code will not execute.
                    return false;
                }

                //permanently remove items coming from deleteFromButton function 
                for (let y = 0; y < this.itemsToDelete.length; y++) {
                    if(this.itemsToDelete[y].itemToDelete === "Richtext"){
                    this.getView().getModel().remove("/ContentValue(GuID=guid'" + this.itemsToDelete[y].sId + "',ArticleGuID=guid'" + sGuID + "')");
                } else if(this.itemsToDelete[y].itemToDelete === "Code"){
                    this.getView().getModel().remove("/CodeValue(GuID=guid'" + this.itemsToDelete[y].sId + "',ArticleGuID=guid'" + sGuID + "')" );
                }
                }

                //create new entries for new content
                for (let x = 0; x < aContent.length; x++) {
                    let sId = aContent[x].sId;
                    if (sId.includes("RichtextToSend")) {
                        const oContentEntry = this.getView().getModel().createEntry("/Articles(guid'" + sGuID + "')" + "/to_contentValue");
                        this.getView().getModel().setProperty(oContentEntry.getPath() + "/ContentValue", aContent[x].getValue());
                        this.getView().getModel().setProperty(oContentEntry.getPath() + "/ArticleGuID", sGuID)
                    }
                }

                for (let z = 0; z < aCode.length; z++) {
                    let sId = aCode[z].sId;
                    if (sId.includes("CodeToSend")) {
                        const oCodeEntry = this.getView().getModel().createEntry("/Articles(guid'" + sGuID + "')" + "/to_codeValue");
                        this.getView().getModel().setProperty(oCodeEntry.getPath() + "/CodeValue", aCode[z].getValue());
                        this.getView().getModel().setProperty(oCodeEntry.getPath() + "/CodeType", aCode[z].getType());
                        this.getView().getModel().setProperty(oCodeEntry.getPath() + "/ArticleGuID", sGuID)
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

            onBeforeCancel: function(){
                let that = this;
             sap.m.MessageBox.warning("All modifications will be discarded. Continue?", {
                actions: [ sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
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
                oView.byId("articleCode").removeAllItems();
            
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
            
                            let iOrderIndex = data.OrderIndex;
                            this.getView().byId("articleContent").insertItem(oType, iOrderIndex);
                            this.getView().byId("articleContent").insertItem(oEditor, iOrderIndex);
                        } else if (data.hasOwnProperty('ContentValue')) {  // If this is from the content data
                            let oFormattedText = new sap.m.FormattedText({
                                htmlText: "{ContentValue}",
                                width: "100%"
                            });
            
                            const sContentPath = this.getView().getModel().createKey("ContentValue", {
                                GuID: data.GuID,
                                ArticleGuID: data.ArticleGuID
                            });
            
                            oFormattedText.bindElement("/" + sContentPath);
            
                            let iOrderIndex = data.OrderIndex;
                            this.getView().byId("articleContent").insertItem(oFormattedText, iOrderIndex);
                        }
                    });
                }).catch((error) => {
                    console.log("Error fetching data:", error);
                });
            },

            // renderDisplayControls: function (sContentPath, sCodePath) {
            //     //remove items so they are not displayed every time the page loads again
            //     let oView = this.getView();
            //     oView.byId("articleContent").removeAllItems();
            //     oView.byId("articleCode").removeAllItems();

            //                     //display Code value
            //                     this.getView().getModel().read(sCodePath, {
            //                         success: function (oData) {
            //                             for (let x = 0; x < oData.results.length; x++) {
                
            //                                 let oType = new sap.m.ComboBox({
            //                                     editable: false,
            //                                     value: "{CodeType}"
            //                                 });
                
            //                                 let oEditor = new sap.ui.codeeditor.CodeEditor({
            //                                     value: "{CodeValue}",
            //                                     type: "{CodeType}",
            //                                     editable: false,
            //                                     width: "100%",
            //                                     height: "300px"
            //                                 });
                
            //                                 //Create binding path
            //                                 const sCodePath = this.getView().getModel().createKey("CodeValue", {
            //                                     GuID: oData.results[x].GuID,
            //                                     ArticleGuID: oData.results[x].ArticleGuID
            //                                 });
                
            //                                 oType.bindElement("/" + sCodePath);
            //                                 oEditor.bindElement("/" + sCodePath);
                
            //                                 let iOrderIndex = oData.results[x].OrderIndex
                
            //                                 //Declaring variables here so VBox.length is counted again in every loop
            //                                 let oVBoxContent = oView.byId("articleCode").getItems();
            //                                 let oIndex = oVBoxContent.length;
                
            //                                 this.getView().byId("articleContent").insertItem(oType, iOrderIndex);
            //                                 this.getView().byId("articleContent").insertItem(oEditor,iOrderIndex);
            //                             }
            //                         }.bind(this),
            //                         error: function (oError) {
            //                             console.log(oError);
            //                         }
            //                     });

            //     // /Content(guid'xxx')
            //     this.getView().getModel().read(sContentPath, {
            //         success: function (oData) {
            //             for (let x = 0; x < oData.results.length; x++) {
            //                 let oFormattedText = new sap.m.FormattedText({
            //                     htmlText: "{ContentValue}",
            //                     width: "100%"
            //                 })

            //                 // Create binding path
            //                 const sContentPath = this.getView().getModel().createKey("ContentValue", {
            //                     GuID: oData.results[x].GuID,
            //                     ArticleGuID: oData.results[x].ArticleGuID
            //                 });

            //                 // Bind formatted text to content path
            //                 oFormattedText.bindElement("/" + sContentPath);

            //                 let iOrderIndex = oData.results[x].OrderIndex

            //                 // //Counting the index here will make sure it is recounted at every loop
            //                 // let oVBoxContent = oView.byId("articleContent").getItems();
            //                 // let oIndex = oVBoxContent.length;

            //                 // Add formatted text to vbox
            //                 this.getView().byId("articleContent").insertItem(oFormattedText, iOrderIndex);
            //             };
            //         }.bind(this),
            //         error: function (oError) {
            //             console.log(oError);
            //         }
            //     });
            // },

            deleteFromButton: function (oEvent, articleGuID, itemToDelete) {
                let item = {
                    //slice everything from ID that is not the GuID
                    sId: oEvent.getSource().getId().slice(14),
                    articleGuID: articleGuID,
                    itemToDelete: itemToDelete
                }
                //push to itemsToDelete for later use in onSaveChanges function
                this.itemsToDelete.push(item);

                //Slice everything from the ID that is not GuID
                let sContentId = oEvent.getSource().getId().slice(14);

                let oElementsArr = this.getView().byId("articleContent");
                let oElement = oElementsArr.getItems();
                let oCodesArr = this.getView().byId("articleCode");
                let oCode = oCodesArr.getItems();

                //only remove richtext from frontend view 
                for (let x = 0; x < oElement.length; x++) {
                    if (oElement[x].sId.includes(sContentId)) {
                        oElementsArr.removeItem(oElement[x]);
                    }
                }

                //only remove codeeditor from frontend view
                for (let y = 0; y < oCode.length; y++) {
                    if (oCode[y].sId.includes(sContentId)) {
                        oCodesArr.removeItem(oCode[y]);
                    }
                }
            },

            renderEditControls: function () {
                let oView = this.getView();

                oView.byId("articleContent").removeAllItems();
                oView.byId("articleCode").removeAllItems();

                let contentGuID = oView.getBindingContext().getObject().GuID;
                let sPath = oView.getModel().createKey("Articles", {
                    GuID: contentGuID
                });


                let oNewContentButton = new sap.m.Button({
                    text: "Add new textbox",
                    icon: "sap-icon://add",
                    press: function () {
                        let oRichText = new RichTextEditor({
                            width: "100%",
                            height: "450px",
                            showGroupFont: true,
                            id: "RichtextToSend" + Date.now()                           
                        });


                        let oVBoxContent = oView.byId("articleContent").getItems();
                        let oIndex = oVBoxContent.length;
                        oView.byId("articleContent").insertItem(oRichText, oIndex + 1);
                    }
                });

                oView.byId("articleContent").insertItem(oNewContentButton);

                //Create textboxes and delete buttons for content
                oView.getModel().read("/" + sPath + "/to_contentValue", {
                    success: function (oData) {
                        for (let x = 0; x < oData.results.length; x++) {

                            let oRichText = new RichTextEditor({
                                value: "{ContentValue}",
                                width: "100%",
                                height: "450px",
                                showGroupFont: true,
                                //Date + GuID alone is invalid id
                                id: "Richtext" + oData.results[x].GuID + Date.now()
                            });

                            let oTextDelete = new sap.m.Button({
                                text: "Delete textbox",
                                icon: "sap-icon://delete",
                                //Date + GuID alone is invalid id
                                id: "b" + Date.now() + oData.results[x].GuID,
                            })

                            // Create binding path
                            const sContentPath = oView.getModel().createKey("ContentValue", {
                                GuID: oData.results[x].GuID,
                                ArticleGuID: oData.results[x].ArticleGuID
                            });

                            // Bind formatted text to content path
                            oRichText.bindElement("/" + sContentPath);

                            //Counting the index here will make sure it is recounted at every loop
                            let oVBoxContent = oView.byId("articleContent").getItems();
                            let oIndex = oVBoxContent.length;
                            let sItemToDelete ="Richtext"

                            oView.byId("articleContent").insertItem(oRichText, oIndex + 1);
                            oView.byId("articleContent").insertItem(oTextDelete, oIndex + 2);
                            //attach the delete function
                            oTextDelete.attachPress(function (oEvent) {
                                this.deleteFromButton(oEvent, oData.results[x].ArticleGuID, sItemToDelete);
                            }, this);
                        }
                    }.bind(this),
                    error: function (oData) {
                        console.log("Error")
                    }
                });

                let oNewCodeButton = new sap.m.Button({
                    text: "Add new codeeditor",
                    icon: "sap-icon://add",
                    press: function () {
                        let oCode = new sap.m.ComboBox({
                            id: "CodeTypeId" + Date.now(),
                            placeholder: "Choose programming language",
                            items: {
                                path: "/codeCollection",
                                template: new sap.ui.core.Item({
                                    key: "{key}",
                                    text: "{code}"
                                })
                            }
                        });
                        let oCodeEditor = new sap.ui.codeeditor.CodeEditor({
                            width: "100%",
                            height: "300px",
                            id: "CodeToSend" + Date.now()
                        });

                        let oVBoxContent = oView.byId("articleCode").getItems();
                        let oIndex = oVBoxContent.length;
                        let oModel = new sap.ui.model.json.JSONModel();
                        oModel.loadData("model/codecollection.json");
                        oModel.setSizeLimit(160);
                        oCode.setModel(oModel);
                        oView.byId("articleCode").insertItem(oCode, oIndex + 1);
                        oView.byId("articleCode").insertItem(oCodeEditor, oIndex + 2);

                        oCode.attachChange(function (oEvent) {
                            let oSelectedItem = oCode.getSelectedItem();
                            let sItemText = oSelectedItem.getText();
                            oCodeEditor.setType(sItemText);
                        });
                    }
                });

                oView.byId("articleCode").insertItem(oNewCodeButton);

                oView.getModel().read("/" + sPath + "/to_codeValue", {
                    success: function (oData) {
                        for (let y = 0; y < oData.results.length; y++) {

                            let oType = new sap.m.ComboBox({
                                //Date + GuID alone is invalid id
                                id: "c" + Date.now() + oData.results[y].GuID,
                                items: {
                                    //template is based on codecollection.json
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
                            oModel.setSizeLimit(160);
                            oType.setModel(oModel);
                            oType.setValue(oData.results[y].CodeType);
                            oType.attachChange(function (oEvent) {
                                let oSelectedItem = oType.getSelectedItem();
                                let sItemText = oSelectedItem.getText();
                                oEditor.setType(sItemText);
                            });

                            let oCodeDelete = new sap.m.Button({
                                text: "Delete textbox",
                                icon: "sap-icon://delete",
                                //Date + GuID alone is invalid id
                                id: "b" + Date.now() + oData.results[y].GuID,
                            });

                            let oEditor = new sap.ui.codeeditor.CodeEditor({
                                value: "{CodeValue}",
                                type: "{CodeType}",
                                width: "100%",
                                height: "300px",
                                id: "oEditor" + oData.results[y].GuID + Date.now()
                            });

                            const sCodePath = oView.getModel().createKey("CodeValue", {
                                GuID: oData.results[y].GuID,
                                ArticleGuID: oData.results[y].ArticleGuID
                            });

                            //Declaring variables here so VBox.length is counted again in every loop
                            let oVBoxContent = oView.byId("articleCode").getItems();
                            let oIndex = oVBoxContent.length;
                            let sItemToDelete = "Code";

                            oType.bindElement("/" + sCodePath);
                            oEditor.bindElement("/" + sCodePath);

                            oView.byId("articleCode").insertItem(oType, oIndex + 1);
                            oView.byId("articleCode").insertItem(oCodeDelete, oIndex + 2);
                            oView.byId("articleCode").insertItem(oEditor, oIndex + 3);
                            oCodeDelete.attachPress(function (oEvent) {
                                this.deleteFromButton(oEvent, oData.results[y].ArticleGuID, sItemToDelete);
                            }, this);
                        }
                    }.bind(this),

                    error: function (oData) {
                        console.log(oData.error);
                    }
                });
            },
        });
    });


//DeleteButton old solution
// let oDeleteButton = new sap.m.Button({
//     text: "Delete textbox",
//     icon: "sap-icon://delete",
//GuID alone is invalid id
// id: "b" + oDate + oData.results[x].GuID,
//press:
// function (oEvent) {
//     let oIdLong = oEvent.getSource().sId;
//     //slice off the b from button id
//     let oId = oIdLong.slice(14);
//     this.contentGuID = contentGuID;
//     this.oView = oView;
//     this.sPath = sPath;
//     let oElementsArr = oView.byId("articleContent");
//     let oElement = oElementsArr.getItems();
//     for (let x = 0; x < oElement.length; x++) {
//         //If Id contains sId, remove from view + delete from database
//         if (oElement[x].sId.includes(oId)) {
//             //Only removes item from frontend
//             oElementsArr.removeItem(oElement[x]);
//             itemsToDelete.push(oElement[x]);

//             // oView.getModel().remove("/ContentValue(GuID=guid'" + oId + "',ArticleGuID=guid'" + contentGuID + "')");
//         }
//     }
// }
//})