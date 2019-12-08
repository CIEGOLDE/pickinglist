sap.ui.define(
	["./BaseController",
		"./designMode",
		"./messages",
		"sap/ui/model/json/JSONModel",
		"sap/ui/export/Spreadsheet",
		"sap/ui/model/Filter",
		"sap/m/Token",
		"cie/pickinglist/util/echarts",
		"cie/pickinglist/pdf/build/pdf",
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
				var jUrl = "/destinations/S4HANACLOUD_BASIC/API_OUTBOUND_DELIVERY_SRV/A_OutbDeliveryHeader";
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
					messages.showText("No data Seletecd");
					return;
				} else {
					for (var i = 0; i < dataArr.length; i++) {
						var text = dataArr[i].mAggregations.cells[0].mProperties.text;
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
					messages.showText("No data Seletecd");
					return;
				} else {
					for (var i = 0; i < dataArr.length; i++) {
						var text = dataArr[i].mAggregations.cells[0].mProperties.text;
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
					messages.showText("No data Seletecd");
					return;
				} else {
					for (var i = 0; i < dataArr.length; i++) {
						var text = dataArr[i].mAggregations.cells[0].mProperties.text;
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
				language = language.substr(0,2);
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
				allFilters.push(new Filter('ShipLang', sap.ui.model.FilterOperator.EQ, language));
				allFilters.push(new Filter('SoldLang', sap.ui.model.FilterOperator.EQ, language));
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
						allFilters.push(new Filter('DeliveryDocument', sap.ui.model.FilterOperator.EQ, DeliveryDocuments[i].mProperties.key));
					}
				}
				if (PlannedGIDate != null) {
					var DateArr = PlannedGIDate.split(" ");
					var startDate = DateArr[0] + 'T00:00:00';
					var endDate = DateArr[2] + 'T23:59:59';S             
					allFilters.push(new Filter('PlannedGoodsIssueDate', sap.ui.model.FilterOperator.BT, startDate,endDate));
				}

				var mParameters = {
					filters: allFilters,
					success: function (oData) {
						that.byId("table").setBusy(false);
						var Arry = oData.results;
						if (Arry.length > 0) {
							var deliverydocument = oData.results;
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
			getdisplay:function (Arry){
				var i;
				var pickinglist = [];
				var pickinglistSet = this._JSONModel.getProperty("/pickinglistSet");
				for (i = 0; i < Arry.length; i++) {
					var pickset = [];
					pickset.DeliveryDocument =Arry[i].OutboundDelivery;
					pickset.ShippingPoint  =Arry[i].ShippingPoint; 
					pickset.SoldToParty =Arry[i].SoldToParty;
					pickset.CustomerName =Arry[i].CustomerName;
					pickset.ShipToParty =Arry[i].ShipToParty;
					pickset.Street =Arry[i].StreetName;
					pickset.City =Arry[i].CityName;
					pickset.PostalCode =Arry[i].PostalCode;
					pickset.Country =Arry[i].Country;
					pickset.PlannedGoodsIssueDate =Arry[i].PlannedGoodsIssueDate;
					pickinglist.push(pickset);
				}
				// var display = pickinglistSet;
				this.disdelivery(pickinglist);
				this._JSONModel.setProperty("/pickinglistSet",pickinglist);
				// pickinglistSet = pickinglist;
			},

			// Print Form
			onPrint: function (oEvent) {
				var pickinglistSet = this._JSONModel.getData().pickinglistSet; //
				var ItemTable = this.getView().byId("table");
				var selectIndexArry = ItemTable.getSelectedIndices();
				var selectItemArr = [];
				if (selectIndexArry.length !== 1) {
					sap.m.MessageBox.warning("Please select one line", {
				// if (selectIndexArry.length <= 0) {
				// 	sap.m.MessageBox.warning("Please select at least one line", {
						title: "Tips"
					});
					this.setBusy(false);
					return;
				}
				this.printadobe();
			},
			getitem: function (deliverydocumentArr, deliverydocumentitem) {
				deliverydocumentitem.sort(function (a, b) {
					if (a.DeliveryDocument === b.deliverydocumentitem) {
						return a.DeliveryDocumentItem - b.DeliveryDocumentItem
					} else {
						return a.deliverydocumentitem - b.deliverydocumentitem
					}
				})
				for (var i = 0; i < deliverydocumentArr.length; i++) {
					// this.printadobe(deliveryarr[i]);
					var allFilters = [];
					var itemSet = [];
					for (var j = 0; j < deliverydocumentitem.length; j++) {
						if (deliverydocumentArr[i] == deliverydocumentitem[j].DeliveryDocument) {
							allFilters.push(new Filter('Material', sap.ui.model.FilterOperator.EQ, "637.837030_1-1C51"));
							// allFilters.push(new Filter('Material', sap.ui.model.FilterOperator.EQ, deliverydocumentitem[j].Material));
							// allFilters.push(new Filter('Plant', sap.ui.model.FilterOperator.EQ, deliverydocumentArr[i]));
							var PalletQuantity = " ";
							this.getprintitempin(deliverydocumentArr[i], allFilters, PalletQuantity);
							// var itemset = [];
							deliverydocumentitem[j].ActualDeliveryQuantity = deliverydocumentitem[j].ActualDeliveryQuantity / PalletQuantity;

							// itemSet.push(itemset);
						} else {
							continue;
						}
					}
					// this.getprintitembatch(deliverydocumentArr[i], allFilters);
					this.getprintitempin(deliverydocumentArr[i], allFilters, PalletQuantity);
				}
			},
			getprintitembatch: function (obj, alfilters) {
				this.byId("table").setBusy(true);
				var object = obj;
				var pickinglistSet = this._JSONModel.getProperty("/pickinglistSet");
				var oDataUrl = "/destinations/S4HANACLOUD_BASIC/API_MATERIAL_STOCK_SRV/A_MatlStkInAcctMod";
				var ODataModel = new sap.ui.model.odata.ODataModel(oDataUrl);
				var oDataUrly = "/destinations/S4HANACLOUD_BASIC/YY1_BO_PIN_QUAN_CDS/YY1_BO_PIN_QUAN";
				var ODataModely = new sap.ui.model.odata.ODataModel(oDataUrly);
				// var oFilter = new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "EN");
				// var aFilters = [oFilter];
				// var sUrl = "/A_Product('" + object + "')/to_Description";
				var mParameters = {
					filters: alfilters,
					success: function (oData, response) {
						this.byId("table").setBusy(false);
						var a = odata.results;
						if (oData.results) {

							//	object.ProductDescription = oData.results[0].ProductDescription;	
							// var batchSet = this._JSONModel.getProperty("/batchSet");
							// for (var i = 0; i < reservationItemsSet.length; i++) {
							// 	if (reservationItemsSet[i].Product == oData.results[0].Product) {
							// 		this._JSONModel.setProperty("/reservationItemsSet/" + i + "/ProductDescription", oData.results[0].ProductDescription);
							// 	}
							// }
						}
					}.bind(this),
					error: function (oError) {
						this.byId("table").setBusy(false);
						messages.showODataErrorText(oError);
					}.bind(this)
				};
				ODataModel.read(oDataUrl, mParameters);
			},
			getprintitempin: function (obj, alfilters, PalletQuantity) {
				this.byId("table").setBusy(true);
				var object = obj;
				var pickinglistSet = this._JSONModel.getProperty("/pickinglistSet");
				var oDataUrl = "/destinations/S4HANACLOUD_BASIC/YY1_BO_PIN_QUAN_CDS";
				var ODataModel = new sap.ui.model.odata.ODataModel(oDataUrl);
				// var oFilter = new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "EN");
				// var aFilters = [oFilter];
				var sUrl = "/YY1_BO_PIN_QUAN";;
				var mParameters = {
					filters: alfilters,
					success: function (oData, response) {
						this.byId("table").setBusy(false);
						if (oData.results) {
							var PalletQuantity = oData.results[0].PalletQuantity;
						}

					}.bind(this),
					error: function (oError) {
						this.byId("table").setBusy(false);
						messages.showODataErrorText(oError);
					}.bind(this)
				};
				ODataModel.read(sUrl, mParameters);
			},
			
			printadobe: function () {
				var arry = "123";
				var that = this;
				var gUrl = "/ads.restapi/v1/forms/ZCP_Pick_List/templates";
				var pUrl = "/ads.restapi/v1/adsRender/pdf";
				var oRequest = "";
				var response = "";
				// this.calltempleate(gUrl, "")
				this.calltempleate(gUrl, "").then(function(result){
					if(result != ""){
						var str =
							"<?xml version=\"1.0\" encoding=\"utf-8\"?><Form xmlns:xfadata=\"http:\/\/www.xfa.org/schema/xfa-data/1.0/\"><DeliveryDocumentNode><DeliveryDocument>1330</DeliveryDocument><Item><DeliveryDocumentITEM>10</DeliveryDocumentITEM><Material>a</Material></Item></DeliveryDocumentNode></Form>";
						var str1 = that.Base64Encode(str); //base64编码
						var oRequest = "{\"xdpTemplate\":\"" + result + "\",\"xmlData\": \"" + str1 + "\"}";
						var pUrl = "/ads.restapi/v1/adsRender/pdf";
						
						that.postpdf(pUrl, oRequest).then(function(r){
							that.pdfPreview(r);
						}).catch(function(oError){
							messages.showODataErrorText(oError);
						});
					}else{
						messages.showODataErrorText("No PDF generated");
					}
				}).catch(function(oError){
					messages.showODataErrorText("Error");
				});
			},

			calltempleate: function (oUrl, oRequest) {
				// var response = "";
				var that = this;
				var promise = new Promise(function(resolve, reject){
					var aData = $.ajax({
					url: oUrl,
					type: "GET",
					data: oRequest,
					dataType: "json",
					contentType: "application/json;charset=\"utf-8\"",
					Accept: "application/json",

					success: function (data, textStatus, jqXHR) {
						var template = data[0].xdpTemplate;
						resolve(template);
					},
					error: function (xhr, status) {
						reject(xhr);
					}
				});
				});
				return promise;
				
			},
			postpdf: function (oUrl, oRequest) {
				var response = "";
				var that = this;
				var promise = new Promise(function(resolve, reject){
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
							console.log("ERROR");
							reject(xhr);
						}
					});
				});
				return promise;
				
			},
			pdfPreview: function(pdfBase64){
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
				}
				this._PDFViewer.open();
			},
			disdelivery: function (arr) {
			var array = arr;
			var len = array.length;
			array.sort();
			// array.sort(function(a,b){
			// 	return a.DeliveryDocument < b.DeliveryDocument
			// });
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

		});

	});