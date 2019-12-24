sap.ui.define(
	["./BaseController",
		"./designMode",
		"./messages",
		"sap/ui/model/json/JSONModel",
		"sap/ui/export/Spreadsheet",
		"sap/ui/model/Filter",
		"sap/m/Token",
		"cie/pickinglist/util/echarts",
		// "cie/pickinglist/pdf/build/pdf",
		"sap/m/MessageToast"
	],
	function (BaseController, designMode, messages, JSONModel, Spreadsheet, Filter, Token, echartsjs, MessageToast) {
		"use strict";

		return BaseController.extend("cie.pickinglist.controller.report", {
			onInit: function () {
				this.getView().addStyleClass("sapUiSizeCompact");
				this._ResourceBundle = this.getModel("i18n").getResourceBundle();
				this._JSONModel = new JSONModel();
				this.setModel(this._JSONModel);
				var oView = this.getView();
				var fValidator = function (args) {
					var text = args.text;
					return new Token({
						key: text,
						text: text
					});
				};
				oView.byId("ShippingPoint").addValidator(fValidator);
				oView.byId("Customer").addValidator(fValidator);
				// oView.byId("ShipToParty").addValidator(fValidator);//
				oView.byId("DeliveryDocument").addValidator(fValidator);
				this.initDateRange();
				this.getInitData();
				this.calltempleate();
			},
			onAfterRendering: function () {
				this.initLocationF4Help();
				this.initPartyF4Help();
				this.initDeliveryF4Help();
			},

			// Init Date
			initDateRange: function () {
				var date = new Date();
				this.byId("PlannedGoodsIssueDate").setTo(date);
				var year = date.getFullYear();
				var nowMonth = date.getMonth() + 1;
				nowMonth = (nowMonth < 10 ? "0" + nowMonth : nowMonth);
				var dateStr = year.toString() + '-' + nowMonth.toString() + '-' + '01';
				this.byId("PlannedGoodsIssueDate").setFrom(new Date(dateStr));
			},

			// Init Data
			getInitData: function () {
				var pickinglist = {
					DeliveryDocument: "",
					ShippingPoint: "",
					SoldToParty: "",
					CustomerName: "",
					ShipToParty: "",
					Street: "",
					City: "",
					PostalCode: "",
					Country: "",
					PlannedGoodsIssueDate: ""
				};
				var pickinglistSet = [];
				this._JSONModel.setProperty("/pickinglist", pickinglist);
				this._JSONModel.setProperty("/pickinglistSet", pickinglistSet);
				this._lang = sap.ui.getCore().getConfiguration().getLanguage();
			},

			//search help
			initLocationF4Help: function () {
				var that = this;
				var jsonModel = new JSONModel();
				var jUrl = "/destinations/S4HANACLOUD_BASIC/YY1_SHIP_POINT_CDS/YY1_SHIP_POINT";
				// var jUrl = "/destinations/S4HANACLOUD_BASIC/YY1_FUNCTIONALLOCATION_CDS/YY1_FunctionalLocation";
				var query = "$select=ShippingPoint,ShippingPointName";
				jsonModel.attachRequestCompleted(function () {
					that._JSONModel.setProperty("/locationF4Set", this.getProperty("/d/results"));
					sap.ui.getCore().byId("ZLOCATION_TTable").setBusy(false);
				});
				jsonModel.loadData(jUrl, query, true);
				if (!this._LocDialog) {
					this._LocDialog = sap.ui.xmlfragment("cie.pickinglist.dialog.location", this);
					designMode.syncStyleClass(this.getView(), this._LocDialog);
					this.getView().addDependent(this._LocDialog);
					sap.ui.getCore().byId("ZLOCATION_TTable").setBusy(true);
				}
			},
			initDeliveryF4Help: function () {
				var that = this;
				var jsonModel = new JSONModel();
				// var sUrl = "/A_OutbDeliveryHeader?$expand=to_DeliveryDocumentPartner/to_Address";
				// var oDataUrl = "/destinations/S4HANACLOUD_BASIC/API_OUTBOUND_DELIVERY_SRV";
				var jUrl = "/destinations/S4HANACLOUD_BASIC/API_OUTBOUND_DELIVERY_SRV/A_OutbDeliveryHeader?$filter=DeliveryDocumentType eq 'LF' or DeliveryDocumentType eq 'NL'";
				// var jUrl = "/destinations/S4HANACLOUD_BASIC/YY1_FUNCTIONALLOCATION_CDS/YY1_FunctionalLocation";
				var query = "$select=DeliveryDocument";
				jsonModel.attachRequestCompleted(function () {
					that._JSONModel.setProperty("/deliveryF4Set", this.getProperty("/d/results"));
					sap.ui.getCore().byId("ZDELIVERY_TTable").setBusy(false);
				});
				jsonModel.loadData(jUrl, query, true);
				if (!this._DeliveryDialog) {
					this._DeliveryDialog = sap.ui.xmlfragment("cie.pickinglist.dialog.delivery", this);
					designMode.syncStyleClass(this.getView(), this._DeliveryDialog);
					this.getView().addDependent(this._DeliveryDialog);
					sap.ui.getCore().byId("ZDELIVERY_TTable").setBusy(true);
				}
			},
			initPartyF4Help: function () {
				var that = this;
				var jsonModel = new JSONModel();
				var jUrl = "/destinations/S4HANACLOUD_BASIC/API_BUSINESS_PARTNER/A_Customer";
				// var jUrl = "/destinations/S4HANACLOUD_BASIC/YY1_FUNCTIONALLOCATION_CDS/YY1_FunctionalLocation";
				var query = "$select=Customer,CustomerName";
				jsonModel.attachRequestCompleted(function () {
					that._JSONModel.setProperty("/partyF4Set", this.getProperty("/d/results"));
					sap.ui.getCore().byId("ZPARTY_TTable").setBusy(false);
				});
				jsonModel.loadData(jUrl, query, true);
				if (!this._PartyDialog) {
					this._PartyDialog = sap.ui.xmlfragment("cie.pickinglist.dialog.party", this);
					designMode.syncStyleClass(this.getView(), this._PartyDialog);
					this.getView().addDependent(this._PartyDialog);
					sap.ui.getCore().byId("ZPARTY_TTable").setBusy(true);
				}
			},
			//******************************************************************************//	
			openLocation: function () {
				this._LocDialog.open();
			},
			openParty: function () {
				this._PartyDialog.open();
			},
			openDelivery: function () {
				this._DeliveryDialog.open();
			},
			onCancelAction: function () {
				this._LocDialog.close();
				this._PartyDialog.close();
				this._DeliveryDialog.close();
			},
			// 所有搜索帮助进行本地的过滤
			onLocF4Search: function (evt) {
				var aFilters = [];
				var query = evt.getSource().getValue();
				var queryId = evt.getParameter("id");
				var QueryValue = queryId.split("-");
				if (query && query.length > 0) {
					var afilter = [];
					var i;
					for (i = 0; i < QueryValue.length; i++) {
						afilter.push(new Filter(QueryValue[i], sap.ui.model.FilterOperator.Contains, query));
					}
					var allFilters = new Filter(afilter, false); // false为并集
					aFilters.push(allFilters);
				}
				var binding = this._LocDialog.getContent()[0].getContent()[1].getBinding("items");
				binding.filter(aFilters);
			},
			onPartyF4Search: function (evt) {
				var aFilters = [];
				var query = evt.getSource().getValue();
				var queryId = evt.getParameter("id");
				var QueryValue = queryId.split("-");
				if (query && query.length > 0) {
					var afilter = [];
					var i;
					for (i = 0; i < QueryValue.length; i++) {
						afilter.push(new Filter(QueryValue[i], sap.ui.model.FilterOperator.Contains, query));
					}
					var allFilters = new Filter(afilter, false); // false为并集
					aFilters.push(allFilters);
				}
				var binding = this._PartyDialog.getContent()[0].getContent()[1].getBinding("items");
				binding.filter(aFilters);
			},
			onDeliveryF4Search: function (evt) {
				var aFilters = [];
				var query = evt.getSource().getValue();
				var queryId = evt.getParameter("id");
				var QueryValue = queryId.split("-");
				if (query && query.length > 0) {
					var afilter = [];
					var i;
					for (i = 0; i < QueryValue.length; i++) {
						afilter.push(new Filter(QueryValue[i], sap.ui.model.FilterOperator.Contains, query));
					}
					var allFilters = new Filter(afilter, false); // false为并集
					aFilters.push(allFilters);
				}
				var binding = this._DeliveryDialog.getContent()[0].getContent()[1].getBinding("items");
				binding.filter(aFilters);
			},
			onConfirmAction: function () {
				var oMultiInput1 = this.getView().byId("ShippingPoint");
				var dataArr = this._LocDialog.getContent()[0].getContent()[1].getSelectedItems();
				if (dataArr.length === 0) {
					messages.showText(this._ResourceBundle.getText("errMsg3"));
					return;
				} else {
					for (var i = 0; i < dataArr.length; i++) {
						/* eslint-disable sap-no-ui5base-prop */
						var text = dataArr[i].mAggregations.cells[0].mProperties.text;
						/* eslint-disable sap-no-ui5base-prop */
						oMultiInput1.addToken(new Token({
							key: text,
							text: text
						}));
					}
				}
				this.onCancelAction();
			},
			onConfirmActionp: function () {
				var oMultiInput1 = this.getView().byId("Customer");
				var dataArr = this._PartyDialog.getContent()[0].getContent()[1].getSelectedItems();
				if (dataArr.length === 0) {
					messages.showText(this._ResourceBundle.getText("errMsg3"));
					return;
				} else {
					for (var i = 0; i < dataArr.length; i++) {
						/* eslint-disable sap-no-ui5base-prop */
						var text = dataArr[i].mAggregations.cells[0].mProperties.text;
						/* eslint-disable sap-no-ui5base-prop */
						oMultiInput1.addToken(new Token({
							key: text,
							text: text
						}));
					}
				}
				this.onCancelAction();
			},
			onConfirmActiond: function () {
				var oMultiInput1 = this.getView().byId("DeliveryDocument");
				var dataArr = this._DeliveryDialog.getContent()[0].getContent()[1].getSelectedItems();
				if (dataArr.length === 0) {
					messages.showText(this._ResourceBundle.getText("errMsg3"));
					return;
				} else {
					for (var i = 0; i < dataArr.length; i++) {
						/* eslint-disable sap-no-ui5base-prop */
						var text = dataArr[i].mAggregations.cells[0].mProperties.text;
						/* eslint-disable sap-no-ui5base-prop */
						oMultiInput1.addToken(new Token({
							key: text,
							text: text
						}));
					}
				}
				this.onCancelAction();
			},

			//******************************************************************************//
			onSearch: function () {
				var that = this;
				var language = this._lang;
				language = language.substr(0, 2);
				that.byId("table").setBusy(true);
				that._JSONModel.setProperty("/pickinglistSet", []);
				// var sUrl = "/A_OutbDeliveryHeader?$expand=to_DeliveryDocumentItem,to_DeliveryDocumentPartner/to_Address";
				// var oDataUrl = "/destinations/S4HANACLOUD_BASIC/API_OUTBOUND_DELIVERY_SRV";
				var sUrl = "/YY1_PICKING_PIN";
				var oDataUrl = "/destinations/S4HANACLOUD_BASIC/YY1_PICKING_PIN_CDS";
				var ODataModel = new sap.ui.model.odata.ODataModel(oDataUrl);

				var ShippingPoint = that.byId("ShippingPoint").getTokens();
				var ShipToParty = that.byId("Customer").getTokens();
				var DeliveryDocument = that.byId("DeliveryDocument").getTokens();
				var PlannedGIDate = that.byId("PlannedGoodsIssueDate").getValue();
				var allFilters = [];
				var i, k;
				// allFilters.push(new Filter('ShipLang', sap.ui.model.FilterOperator.EQ, language));
				// allFilters.push(new Filter('SoldLang', sap.ui.model.FilterOperator.EQ, language));
				if (ShippingPoint.length > 0) {
					for (i = 0; i < ShippingPoint.length; i++) {
						allFilters.push(new Filter('ShippingPoint', sap.ui.model.FilterOperator.EQ, ShippingPoint[i].mProperties.key));
					}
				}
				if (ShipToParty.length > 0) {
					for (i = 0; i < ShipToParty.length; i++) {
						allFilters.push(new Filter('ShipToParty', sap.ui.model.FilterOperator.EQ, ShipToParty[i].mProperties.key));
					}
				}
				if (DeliveryDocument.length > 0) {
					for (i = 0; i < DeliveryDocument.length; i++) {
						allFilters.push(new Filter('OutboundDelivery', sap.ui.model.FilterOperator.EQ, DeliveryDocument[i].mProperties.key));
					}
				}
				if (PlannedGIDate != null) {
					var DateArr = PlannedGIDate.split(" ");
					var startDate = DateArr[0] + 'T00:00:00';
					var endDate = DateArr[2] + 'T23:59:59';
					allFilters.push(new Filter('PlannedGoodsIssueDate', sap.ui.model.FilterOperator.BT, startDate, endDate));
				}

				var mParameters = {
					filters: allFilters,
					success: function (oData) {
						that.byId("table").setBusy(false);
						var Arry = oData.results;
						if (Arry.length > 0) {
							var deliverydocument = oData.results;
							this._JSONModel.setProperty("/deliverydocumentSet", deliverydocument);
							that.getdisplay(Arry);
						} else {
							messages.showText("No Data!");
						}
					}.bind(that),
					error: function (oError) {
						this.byId("table").setBusy(false);
						messages.showODataErrorText(oError);
					}.bind(that)
				};
				ODataModel.read(sUrl, mParameters);
			},
			getdisplay: function (Arry) {
				var i;
				var pickinglist = [];
				var pickinglistSet = this._JSONModel.getProperty("/pickinglistSet");
				for (i = 0; i < Arry.length; i++) {
					var pickset = [];
					pickset.DeliveryDocument = Arry[i].OutboundDelivery;
					pickset.ShippingPoint = Arry[i].ShippingPoint;
					pickset.SoldToParty = Arry[i].SoldToParty;
					pickset.CustomerName = Arry[i].CustomerName;
					pickset.ShipToParty = Arry[i].ShipToParty;
					pickset.Street = Arry[i].StreetName;
					pickset.City = Arry[i].CityName;
					pickset.PostalCode = Arry[i].PostalCode;
					pickset.Country = Arry[i].Country;
					pickset.PlannedGoodsIssueDate = Arry[i].PlannedGoodsIssueDate;
					pickinglist.push(pickset);
				}
				// var display = pickinglistSet;
				this.disdelivery(pickinglist);
				this._JSONModel.setProperty("/pickinglistSet", pickinglist);
				// pickinglistSet = pickinglist;
			},

			// Print Form
			onPrint: function (oEvent) {
				this.byId("page").setBusy(true);
				var pickinglistSet = this._JSONModel.getData().pickinglistSet; //
				var ItemTable = this.getView().byId("table");
				var selectIndexArry = ItemTable.getSelectedIndices();
				var selectItemArr = [];
				var that = this;
				if (selectIndexArry.length > 10) {
					sap.m.MessageBox.warning(this._ResourceBundle.getText("errMsg1"), {
						title: this._ResourceBundle.getText("Tips")
					});
					this.byId("page").setBusy(false);
					return;
				}
				var documentitem = this._JSONModel.getData().deliverydocumentSet;
				var Arry = [];
				var oneFilters = [];
				var allFilters = [];
				var aFilters = [];
				for (var j = 0; j < selectIndexArry.length; j++) {
					var delivery = pickinglistSet[selectIndexArry[j]].DeliveryDocument;
					for (var i = 0; i < documentitem.length; i++) {
						if (delivery === documentitem[i].OutboundDelivery) {
							var item = [];
							item = documentitem[i];
							Arry.push(item);
							oneFilters = [];
							oneFilters.push(new Filter("Material", sap.ui.model.FilterOperator.EQ, item.Material));
							oneFilters.push(new Filter("Plant", sap.ui.model.FilterOperator.EQ, item.Plant));
							allFilters.push(new Filter(oneFilters, true));
						}
					}
				}
				var oFilters = new Filter(allFilters, false); // false为并集
				aFilters.push(oFilters);
				aFilters.push(new Filter("OutboundDelivery", sap.ui.model.FilterOperator.EQ, null));
				var bFilters = [];
				bFilters.push(oFilters);
				
				if (Arry.length === 0) {
					this.byId("page").setBusy(false);
					return;
				}

				Arry.sort(function (a, b) {
					if (a.OutboundDelivery === b.OutboundDelivery) {
						return a.OutboundDeliveryItem - b.OutboundDeliveryItem;
					} else {
						return a.OutboundDelivery - b.OutboundDelivery;
					}
				});
				this.getBatchRec(aFilters, that).then(function (result) {
					var aBatch = that.distinctBatch(result);
					that.batchstock(bFilters, that).then(function (bresult) {//new
						var bBatch = bresult;
						var cBatch = [];
						var oRequest = [];
						for ( i = 0; i<aBatch.length; i++) {
							for (j= 0;j<bBatch.length;j++){
								if (aBatch[i].Material === bBatch[j].Material & aBatch[i].Plant === bBatch[j].Plant & aBatch[i].Batch === bBatch[j].Batch){
									cBatch.push(aBatch[i]);
								}
							}
						}
						var aXML = that.processXML(cBatch, Arry, that);
						that._JSONModel.setProperty("/printTotal",aXML.length);
						that._JSONModel.setProperty("/b64Set", []);
						that._JSONModel.setProperty("/printError", false);
						for (var i = 0; i < aXML.length; i++){
							that.printadobe(aXML[i]);
						}
					});//new
				});
			},
			printadobe: function (xml) {
				var that = this;
				var pUrl = "/ads.restapi/v1/adsRender/pdf";
				var response = "";
				var template = this._JSONModel.getProperty("/printTemplate");
				var total = this._JSONModel.getProperty("/printTotal");
				var str1 = that.Base64Encode(xml); //base64编码
				var oRequest = "{\"xdpTemplate\":\"" + template + "\",\"xmlData\": \"" + str1 + "\"}";
				that.postpdf(pUrl, oRequest).then(function (r) {
					var b64Set = that._JSONModel.getProperty("/b64Set");
					if(b64Set.length+1 == total){
						b64Set.push(r);
						that.pdfMerge(b64Set);
					}else{
						b64Set.push(r);
						that._JSONModel.setProperty("/b64Set", b64Set);
					};
				}).catch(function (oError) {
					if(!that._JSONModel.setProperty("/printError")){
						that.byId("page").setBusy(false);
						that._JSONModel.setProperty("/printError",true);
						messages.showODataErrorText(oError);
					}
				});
			},

			calltempleate: function () {
				// var response = "";
				var that = this;
				var aData = $.ajax({
					url: "/ads.restapi/v1/forms/ZCP_Pick_List/templates",
					type: "GET",
					data: "",
					dataType: "json",
					contentType: "application/json;charset=\"utf-8\"",
					Accept: "application/json",

					success: function (data, textStatus, jqXHR) {
						var template = data[0].xdpTemplate;
						that._JSONModel.setProperty("/printTemplate", template);
						that.byId("btnPrint").setProperty("enabled",true);
					},
					error: function (xhr, status) {
						sap.m.MessageBox.error(that._ResourceBundle.getText("errMsg4"), {
							title: that._ResourceBundle.getText("errBox")
						});
					}
				});
			},
			postpdf: function (oUrl, oRequest) {
				var response = "";
				var that = this;
				var promise = new Promise(function (resolve, reject) {
					var aData = $.ajax({
						url: oUrl,
						type: "POST",
						data: oRequest,
						dataType: "json",
						contentType: "application/json;charset=\"utf-8\"",
						Accept: "application/json",

						success: function (data, textStatus, jqXHR) {
							response = data.fileContent;
							resolve(response);
						},
						error: function (xhr, status) {
							reject(xhr);
						}
					});
				});
				return promise;
			},
			pdfMerge: function(b64Set){
				var that = this;
				var aData = $.ajax({
					url: "/pdfMerge",
					type: "POST",
					data: JSON.stringify( b64Set ),
					dataType: "json",
					contentType: "application/json;charset=\"utf-8\"",
					Accept: "application/json",
	
					success: function (data, textStatus, jqXHR) {
						var result = data.base64PDF;
						that.byId("table").clearSelection();
						that.pdfPreview(result);	
					},
					error: function (xhr, status) {
						that.setBusy(false);
						sap.m.MessageBox.error(that._ResourceBundle.getText("errMsg5"), {
							title: that._ResourceBundle.getText("errBox")
						});
					}
				});
			},
			pdfPreview: function (pdfBase64) {
				var decodedPdfContent = atob(pdfBase64);
				var byteArray = new Uint8Array(decodedPdfContent.length);
				for (var i = 0; i < decodedPdfContent.length; i++) {
					byteArray[i] = decodedPdfContent.charCodeAt(i);
				}
				var blob = new Blob([byteArray.buffer], {
					type: 'application/pdf'
				});
				var _pdfurl = URL.createObjectURL(blob);

				if (!this._PDFViewer) {
					this._PDFViewer = new sap.m.PDFViewer({
						width: "auto",
						source: _pdfurl
					});
					jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist
				}else{
					this._PDFViewer.setProperty("source",_pdfurl);
				}
				this.byId("page").setBusy(false);
				this._PDFViewer.open();
			},
			disdelivery: function (arr) {
				var array = arr;
				var len = array.length;
				// array.sort();
				array.sort(function (a, b) {
					return a.DeliveryDocument - b.DeliveryDocument;
				});

				function loop(index) {
					if (index >= 1) {
						if (array[index].DeliveryDocument === array[index - 1].DeliveryDocument) {
							array.splice(index, 1);
						}
						loop(index - 1);
					}
				}
				loop(len - 1);
				return array;
			},
			getBatchRec: function (aFilters, oController) {
				var oDataUrl = "/destinations/S4HANACLOUD_BASIC/YY1_BATCH_DATE1_CDS";
				var ODataModel = new sap.ui.model.odata.ODataModel(oDataUrl);
				var sUrl = "/YY1_BATCH_DATE1";
				var sortParameter = "Material,Plant,ManufactureDate";
				var mUrlParameter = {
					"$orderby": sortParameter
				};
				var promise = new Promise(function (resolve, reject) {
					var mParameters = {
						filters: aFilters,
						urlParameters: mUrlParameter,
						// sorters: aSorters,
						success: function (oData, response) {
							// this.setBusy( false ); 
							var result = {};
							if (oData.results) {
								result = oData.results;
							}
							resolve(result);
						}.bind(oController),
						error: function (oError) {
							oController.setBusy(false);
							messages.showODataErrorText(oError);
							reject(oError);
						}.bind(oController)
					};
					ODataModel.read(sUrl, mParameters);
				});
				return promise;
			},
			processXML: function (aBatch, aDoc, oController) {
				var count = 0;
				var aXML = [];
				var xml = "";
				var batch = "";
				var date = "";
				var item = "";
				var container = 0;
				for (var i = 0; i < aDoc.length; i++) {
					count = 0;
					batch = "";
					date = "";
					if (parseInt(aDoc[i].PalletQuantity) !== 0 && aDoc[i].PalletQuantity !== "") {
						container = Math.ceil(parseInt(aDoc[i].ActualDeliveryQuantity) / parseInt(aDoc[i].PalletQuantity));
					} else {
						container = 0;
					}
					for (var j = 0; j < aBatch.length; j++) {
						if (aBatch[j].Material === aDoc[i].Material && aBatch[j].Plant === aDoc[i].Plant) {
							count++;
							if (count > container || container === 0) {
								break;
							}
							batch = batch === "" ? aBatch[j].Batch : batch + "\n" + aBatch[j].Batch;
							if (aBatch[j].ManufactureDate != null) {
								date = date === "" ? aBatch[j].ManufactureDate.split("T")[0] : date + "\n" + aBatch[j].ManufactureDate.split("T")[0];
							} else {
								date = date === "" ? " " : date + "\n" + " ";
							}
						};
					};
					item = item + "<Item><DeliveryDocumentItem>" + aDoc[i].OutboundDeliveryItem + "</DeliveryDocumentItem>";
					item = item + "<Material>" + aDoc[i].Material + "</Material>";
					item = item + "<Plant>" + aDoc[i].Plant + "</Plant>";
					item = item + "<MaterialByCustomer>" + aDoc[i].MaterialByCustomer + "</MaterialByCustomer>";
					item = item + "<ActualDeliveryQuantity>" + aDoc[i].ActualDeliveryQuantity + "</ActualDeliveryQuantity>";
					item = item + "<DeliveryQuantityUnit>" + aDoc[i].DeliveryQuantityUnit + "</DeliveryQuantityUnit>";
					item = item + "<StorageLocation>" + aDoc[i].StorageLocation + "</StorageLocation>";
					if (container !== 0) {
						item = item + "<PinQuantity>" + container + "</PinQuantity>";
						item = item + "<Batch>" + batch + "</Batch>";
						item = item + "<ManufactureDate>" + date + "</ManufactureDate></Item>";
					} else {
						item = item + "</Item>";
					}

					if (aDoc[i + 1] === undefined) {
						xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Form><DeliveryDocumentNode>";
						xml = xml + "<DeliveryDocument>" + aDoc[i].OutboundDelivery + "</DeliveryDocument>";
						xml = xml + "<ShippingPoint>" + aDoc[i].ShippingPoint + "</ShippingPoint>";
						xml = xml + "<SoldToParty>" + aDoc[i].SoldToParty + "</SoldToParty>";
						xml = xml + "<CustomerName>" + aDoc[i].CustomerName + "</CustomerName>";
						xml = xml + "<ShipToParty>" + aDoc[i].ShipToParty + "</ShipToParty>";
						// xml = xml + "<ShipToName>" + "</ShipToName>";
						xml = xml + "<Street>" + aDoc[i].StreetName + "</Street>";
						xml = xml + "<City>" + aDoc[i].CityName + "</City>";
						xml = xml + "<PostalCode>" + aDoc[i].PostalCode + "</PostalCode>";
						xml = xml + "<Country>" + aDoc[i].Country + "</Country>";
						xml = xml + "<PlannedGoodsIssueDate>" + aDoc[i].PlannedGoodsIssueDate.split("T")[0] + "</PlannedGoodsIssueDate>";
						xml = xml + item + "</DeliveryDocumentNode></Form>";
						aXML.push(xml);
						item = "";
					} else if (aDoc[i].OutboundDelivery !== aDoc[i + 1].OutboundDelivery) {
						xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Form><DeliveryDocumentNode>";
						xml = xml + "<DeliveryDocument>" + aDoc[i].OutboundDelivery + "</DeliveryDocument>";
						xml = xml + "<ShippingPoint>" + aDoc[i].ShippingPoint + "</ShippingPoint>";
						xml = xml + "<SoldToParty>" + aDoc[i].SoldToParty + "</SoldToParty>";
						xml = xml + "<CustomerName>" + aDoc[i].CustomerName + "</CustomerName>";
						xml = xml + "<ShipToParty>" + aDoc[i].ShipToParty + "</ShipToParty>";
						// xml = xml + "<ShipToName>" + "</ShipToName>";
						xml = xml + "<Street>" + aDoc[i].StreetName + "</Street>";
						xml = xml + "<City>" + aDoc[i].CityName + "</City>";
						xml = xml + "<PostalCode>" + aDoc[i].PostalCode + "</PostalCode>";
						xml = xml + "<Country>" + aDoc[i].Country + "</Country>";
						xml = xml + "<PlannedGoodsIssueDate>" + aDoc[i].PlannedGoodsIssueDate.split("T")[0] + "</PlannedGoodsIssueDate>";
						xml = xml + item + "</DeliveryDocumentNode></Form>";
						aXML.push(xml);
						item = "";
					}
				}
				return aXML;
			},
			distinctBatch: function (arr) {
				var obj = {};
				var result = [];
				for (var i = 0; i < arr.length; i++) {
					if (obj[arr[i].Batch]===undefined) {
						result.push(arr[i]);
						obj[arr[i].Batch] = 1;
					}
				}
				return result;
			},
			batchstock: function(aFilters,oController) {
				var oDataUrl = "/destinations/S4HANACLOUD_BASIC/API_MATERIAL_STOCK_SRV";
				var ODataModel = new sap.ui.model.odata.ODataModel(oDataUrl);
				var sUrl = "/A_MatlStkInAcctMod";
				var sortParameter = "Material,Plant";
				var mUrlParameter = {
					"$orderby": sortParameter
				};
				aFilters.push(new Filter("MatlWrhsStkQtyInMatlBaseUnit ", sap.ui.model.FilterOperator.NE, 0));
				var promise = new Promise(function (resolve, reject) {
					var mParameters = {
						filters: aFilters,
						urlParameters: mUrlParameter,
						// sorters: aSorters,
						success: function (oData, response) {
							// this.setBusy( false ); 
							var result = {};
							if (oData.results) {
								result = oData.results;
							}
							resolve(result);
						}.bind(oController),
						error: function (oError) {
							oController.setBusy(false);
							messages.showODataErrorText(oError);
							reject(oError);
						}.bind(oController)
					};
					ODataModel.read(sUrl, mParameters);
				});
				return promise;
			}
		});

	});