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
		// ],
		// function (BaseController, JSONModel, Filter, FilterOperator, MessageToast, MessageBox, messages, designMode) {
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
				// oView.byId("ShipToParty").addValidator(fValidator);
				oView.byId("DeliveryDocument").addValidator(fValidator);
				// this.initDateRange();
				this.getInitData();
			},
			onAfterRendering: function () {
				this.initLocationF4Help();
				this.initPartyF4Help();
				this.initDeliveryF4Help();
			},

			// Init Date
			// initDateRange: function () {
			// 	var date = new Date();
			// 	this.byId("PlannedGoodsIssueDate").setTo(date);
			// 	var year = date.getFullYear();
			// 	var nowMonth = date.getMonth() + 1;
			// 	nowMonth = (nowMonth < 10 ? "0" + nowMonth : nowMonth);
			// 	var dateStr = year.toString() + '-' + nowMonth.toString() + '-' + '01';
			// 	this.byId("PlannedGoodsIssueDate").setFrom(new Date(dateStr));
			// },

			// Init Data
			getInitData: function () {
				var pickinglist = {
					DeliveryDocument: "",
					ShippingPoint: "",
					SoldToParty: "",
					customername: "",
					shiptoparty: "",
					Street: "",
					City: "",
					PostalCode: "",
					Country: "",
					PlannedGoodsIssueDate: ""
				};
				var pickinglistSet = [];
				this._JSONModel.setProperty("/pickinglist", pickinglist);
				this._JSONModel.setProperty("/pickinglistSet", pickinglistSet);
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
				that.byId("table").setBusy(true);
				that._JSONModel.setProperty("/pickinglistSet", []);
				var sUrl = "/A_OutbDeliveryHeader?$expand=to_DeliveryDocumentItem,to_DeliveryDocumentPartner/to_Address";
				var oDataUrl = "/destinations/S4HANACLOUD_BASIC/API_OUTBOUND_DELIVERY_SRV";
				var ODataModel = new sap.ui.model.odata.ODataModel(oDataUrl);

				var ShippingPoint = that.byId("ShippingPoint").getTokens();
				var ShipToParty = that.byId("Customer").getTokens();
				var DeliveryDocument = that.byId("DeliveryDocument").getTokens();
				// var PlannedGIDate = that.byId("PlannedGoodsIssueDate").getValue();
				var allFilters = [];
				var i, k;
				// that._JSONModel.setProperty("/target",target);			
				// that._JSONModel.setProperty("/productionTime",productionTime);
				// if (ShippingPoint.length===0) {
				// 	that.byId("table").setBusy(false);					
				// 	MessageToast.show("Please input Shipping Point！");
				// 	return;
				// }	
				// if(!productionTime){
				// 	that.byId("table").setBusy(false);					
				// 	MessageToast.show("Please input Production Time！");
				// 	return;				
				// }
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
				// if (PlannedGIDate != null) {
				// 	var DateArr = PlannedGIDate.split(" ");
				// 	var startDate = DateArr[0] + 'T00:00:00';
				// 	var endDate = DateArr[2] + 'T23:59:59';
				// 	var filterParameter =
				// 		"&$filter=(PlannedGoodsIssueDate ge datetime'" + startDate + "' and PlannedGoodsIssueDate le datetime'" + endDate + "')";
				// 	// sUrl = sUrl + filterParameter;
				// 	// allFilters.push(new Filter('PlannedGoodsIssueDate', sap.ui.model.FilterOperator.EQ, startDate));
				// }

				var mParameters = {
					filters: allFilters,
					success: function (oData) {
						that.byId("table").setBusy(false);
						var Arry = oData.results;
						if (Arry.length > 0) {
							// this.processReaservationItem(Arry);
							that._JSONModel.setProperty("/pickinglistSet", Arry);
							that.getprocessname(Arry);
							// that.getbatch(Arry.results.to_DeliveryDocumentItem);
							// that.getPINQuantity();
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
			// Item Data Process
			getprocessname: function (Arry) {
				var i, j;
				var pickinglistSet = this._JSONModel.getProperty("/pickinglistSet");
				var partnerArry = [];
				for (i = 0; i < Arry.length; i++) {
					partnerArry = Arry[i].to_DeliveryDocumentPartner.results;
					for (j = 0; j < partnerArry.length; j++) {
						if (Arry[i].SoldToParty == partnerArry[j].Customer) {
							var soldset = {};
							// pickinglistset.DeliveryDocument = Arry[i].DeliveryDocument;
							soldset.customername = partnerArry[j].to_Address.BusinessPartnerName1;
							//pickinglistSet.push(soldset);
							this._JSONModel.setProperty("/pickinglistSet/" + i + "/customername", partnerArry[j].to_Address.BusinessPartnerName1);
						}
						if (Arry[i].ShipToParty == partnerArry[j].Customer) {
							var shipset = {};
							// pickinglistset.DeliveryDocument = Arry[i].DeliveryDocument;
							shipset.Street = partnerArry[j].to_Address.StreetName;
							shipset.City = partnerArry[j].to_Address.CityName;
							shipset.PostalCode = partnerArry[j].to_Address.PostalCode;
							shipset.Country = partnerArry[j].to_Address.Country;
							// pickinglistSet.push(shipset);
							this._JSONModel.setProperty("/pickinglistSet/" + i + "/Street", shipset.Street);
							this._JSONModel.setProperty("/pickinglistSet/" + i + "/City", shipset.City);
							this._JSONModel.setProperty("/pickinglistSet/" + i + "/PostalCode", shipset.PostalCode);
							this._JSONModel.setProperty("/pickinglistSet/" + i + "/Country", shipset.Country);
							// "/customername", partnerArry[j].to_Address.BusinessPartnerName1);
						}
					}
				}
			},
			getbatch: function (Arry) {
				var i, j;
				var pickinglistSet = this._JSONModel.getProperty("/pickinglistSet");
				var partnerArry = [];
				for (i = 0; i < Arry.length; i++) {
					partnerArry = Arry[i].to_DeliveryDocumentPartner.results;
					for (j = 0; j < partnerArry.length; j++) {
						if (Arry[i].SoldToParty == partnerArry[j].Customer) {
							var soldset = {};
							// pickinglistset.DeliveryDocument = Arry[i].DeliveryDocument;
							soldset.customername = partnerArry[j].to_Address.BusinessPartnerName1;
							// pickinglistSet.push(soldset);
							this._JSONModel.setProperty("/pickinglistSet/" + i + "/customername", partnerArry[j].to_Address.BusinessPartnerName1);
						}
						if (Arry[i].ShipToParty == partnerArry[j].Customer) {
							var shipset = {};
							// pickinglistset.DeliveryDocument = Arry[i].DeliveryDocument;
							shipset.Street = partnerArry[j].to_Address.StreetName;
							shipset.City = partnerArry[j].to_Address.CityName;
							shipset.PostalCode = partnerArry[j].to_Address.PostalCode;
							shipset.Country = partnerArry[j].to_Address.Country;
							// pickinglistSet.push(shipset);
							this._JSONModel.setProperty("/pickinglistSet/" + i + "/Street", shipset.Street);
							this._JSONModel.setProperty("/pickinglistSet/" + i + "/City", shipset.City);
							this._JSONModel.setProperty("/pickinglistSet/" + i + "/PostalCode", shipset.PostalCode);
							this._JSONModel.setProperty("/pickinglistSet/" + i + "/Country", shipset.Country);
							// "/customername", partnerArry[j].to_Address.BusinessPartnerName1);
						}
					}
				}
			},
			// Print Form
			onPrint: function (oEvent) {
				var pickinglistSet = this._JSONModel.getData().pickinglistSet; //
				var ItemTable = this.getView().byId("table");
				var selectIndexArry = ItemTable.getSelectedIndices();
				var selectItemArr = [];
				if (selectIndexArry.length <= 0) {
					sap.m.MessageBox.warning("Please select at least one line", {
						title: "Tips"
					});
					this.setBusy(false);
					return;
				}
				// } else {
				// 	// var str1 = this.Base64Encode("123zhong"); //base64编码
				// 	// var str2 = this.Base64Decode(str1); //base64解码

				// 	this.getitem();
				this.printadobe("xmlfield/xmlfile");
				// }
				// var deliverydocumentheader = [];
				// var deliverydocumentitem = [];
				// for (var y = selectIndexArry.length - 1; y >= 0; y--) {
				// 	var selectItem = pickinglistSet[selectIndexArry[y]].DeliveryDocument;
				// 	selectItemArr.push(selectItem);
				// 	var header = [];
				// 	header.DeliveryDocument = pickinglistSet[selectIndexArry[y]].DeliveryDocument;
				// 	header.ShippingPoint = pickinglistSet[selectIndexArry[y]].ShippingPoint;
				// 	header.SoldToParty = pickinglistSet[selectIndexArry[y]].SoldToParty;
				// 	header.CustomerName = pickinglistSet[selectIndexArry[y]].CustomerName;
				// 	header.ShipToParty = pickinglistSet[selectIndexArry[y]].ShipToParty;
				// 	header.Street = pickinglistSet[selectIndexArry[y]].Street;
				// 	header.City = pickinglistSet[selectIndexArry[y]].City;
				// 	header.PostalCode = pickinglistSet[selectIndexArry[y]].PostalCode;
				// 	header.Country = pickinglistSet[selectIndexArry[y]].Country;
				// 	header.PlannedGoodsIssueDate = pickinglistSet[selectIndexArry[y]].PlannedGoodsIssueDate;
				// 	deliverydocumentheader.push(header);
				// 	var ddil = pickinglistSet[selectIndexArry[y]].to_DeliveryDocumentItem.results.length;
				// 	// for (var j=0;j<pickinglistSet[selectIndexArry[y]].to_DeliveryDocumentItem.length;j++){
				// 	for (var j = 0; j < ddil; j++) {
				// 		var item = [];
				// 		item.DeliveryDocument = pickinglistSet[selectIndexArry[y]].DeliveryDocument;
				// 		item.DeliveryDocumentItem = pickinglistSet[selectIndexArry[y]].to_DeliveryDocumentItem.results[j].DeliveryDocumentItem;
				// 		item.Material = pickinglistSet[selectIndexArry[y]].to_DeliveryDocumentItem.results[j].Material;
				// 		item.Plant = pickinglistSet[selectIndexArry[y]].to_DeliveryDocumentItem.results[j].Plant;
				// 		item.MaterialByCustomer = pickinglistSet[selectIndexArry[y]].to_DeliveryDocumentItem.results[j].MaterialByCustomer;
				// 		item.ActualDeliveryQuantity = pickinglistSet[selectIndexArry[y]].to_DeliveryDocumentItem.results[j].ActualDeliveryQuantity;
				// 		item.DeliveryQuantityUnit = pickinglistSet[selectIndexArry[y]].to_DeliveryDocumentItem.results[j].DeliveryQuantityUnit;
				// 		item.StorageLocation = pickinglistSet[selectIndexArry[y]].to_DeliveryDocumentItem.results[j].StorageLocation;
				// 		deliverydocumentitem.push(item);
				// 	}
				// }
				// var deliverydocumentArr = this.unique(selectItemArr);
				// if (deliverydocumentArr) {
				// 	//call pdf templeate first, second,eachitem   third post
				// 	this.getitem(deliverydocumentArr, deliverydocumentitem);
				// }
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
				// var arry = "<?xml version="1.0 "encoding="utf-8 "?><Form xmlns:xfadata="http:\/\/www.xfa.org/schema/xfa-data/1.0/"><DeliveryDocumentNode><DeliveryDocument>1330</DeliveryDocument></DeliveryDocumentNode></Form>";
				var str1 = this.Base64Encode(arry);
				// that.byId("table").setBusy(true);
				// that._JSONModel.setProperty("/pickinglistSet", []);
				// var sUrl = "https://adsrestapiformsprocessing-prm3t8tep2.eu2.hana.ondemand.com/ads.restapi/v1/forms/ZCP_Pick_List/templates";
				// var sUrl = "/destinations/ADS/v1/forms/$metadata?sap-language=ZH";
				////var sUrl = "https://adsrestapiformsprocessing-prm3t8tep2.eu2.hana.ondemand.com/ads.restapi/";
				// var sUrl = "https://adsrestapiformsprocessing-prm3t8tep2.eu2.hana.ondemand.com/ads.restapi/v1/forms/ZCP_Pick_List/templates";
				// var sUrl = "/destinations/ADS_ADOBE/v1/forms/$metadata";
				// var proxy = 'https://cors-anywhere.herokuapp.com/';
				// /ZCP_Pick_List/templates";
				// /ads.restapi/v1/forms/ZCP_Pick_List/templates"; "destinations/ADS";
				// var ODataModel = new sap.ui.model.odata.ODataModel(oDataUrl);
				// ODataModel.read(sUrl, mParameters);
				// this.calltempleate(sUrl,"",proxy); url: proxy + oUrl,
				var gUrl = "/ads.restapi/v1/forms/ZCP_Pick_List/templates";
				var pUrl = "/ads.restapi/v1/adsRender/pdf";
				var oRequest = "";
				var response = "";
				this.calltempleate(gUrl, "");
				// var templeate = this.calltempleate(gUrl, "");
				// if (templeate == "") {
				// 	sap.m.MessageBox.warning("Please select at least one line", {
				// 		title: "Tips"
				// 	});
				// 	this.setBusy(false);
				// 	return;
				// } else {
				// 	// https://adsrestapiformsprocessing-prm3t8tep2.eu2.hana.ondemand.com/ads.restapi/v1/adsRender/pdf
				// 	// var str = "<?xml version=\"1.0\" encoding=\"utf-8\"?><Form xmlns:xfadata=\"http:\/\/www.xfa.org/schema/xfa-data/1.0/\"><DeliveryDocumentNode><DeliveryDocument>1330</DeliveryDocument><Item><DeliveryDocumentITEM>10</DeliveryDocumentITEM><Material>a</Material></Item></DeliveryDocumentNode></Form>";
				// 	// var str1 = this.Base64Encode(str); //base64编码
				// 	// var oRequest = "{\"xdpTemplate\":\"" + templeate + "\",\"xmlData\": \"" + str1 + "\"}";
				// 	// var printdata = this.postpdf(pUrl, oRequest);
				// 	// var printdata1 = this.Base64Decode(printdata);
				// }
			},

			calltempleate: function (oUrl, oRequest) {
				// var response = "";
				var that = this;
				var aData = $.ajax({
					url: oUrl,
					type: "GET",
					data: oRequest,
					/*	headers: { 'Access-Control-Allow-Origin': '*' , 'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE','Access-Control-Allow-Headers': 'Content-Type'
							         },
						    */
					dataType: "json",
					contentType: "application/json;charset=\"utf-8\"",
					Accept: "application/json",

					success: function (data, textStatus, jqXHR) {
						// response = data.xdpTemplate;
						var templeate = data[0].xdpTemplate;
						// return response;
						var str =
							"<?xml version=\"1.0\" encoding=\"utf-8\"?><Form xmlns:xfadata=\"http:\/\/www.xfa.org/schema/xfa-data/1.0/\"><DeliveryDocumentNode><DeliveryDocument>1330</DeliveryDocument><Item><DeliveryDocumentITEM>10</DeliveryDocumentITEM><Material>a</Material></Item></DeliveryDocumentNode></Form>";
						var str1 = that.Base64Encode(str); //base64编码
						var oRequest = "{\"xdpTemplate\":\"" + templeate + "\",\"xmlData\": \"" + str1 + "\"}";
						var pUrl = "/ads.restapi/v1/adsRender/pdf";
						// for(循环单据，post生成PDF，判断是否是最后一行)
						that.postpdf(pUrl, oRequest);
						// var printdata = this.postpdf(pUrl, oRequest);
						// var promise = new Promise(function (resolve, reject) {
						// 	// Get Box Label Data
						// 	that.postpdf(pUrl, oRequest).then(function(response){
						// 	if (responses != ""){
						// 		console.log("COMPLETE222");
						// 	}}
						// 		);
						// 	// if (response ==""){
						// 	// 	reslove(pp);
						// 	// }
						// });
						// promise.then(function(){
						// 	console.log("COMPLETE111");}
						// 	// ).catch(
						// 	// 	console.log("COMPLETE222");
						// 		);
						// return promise;
						// var promise = new Promise(function (resolve, reject) {
						// 	var test = that.postpdf(pUrl, oRequest);
						// 	test.then(function (response) {
						// 			// Call ZPL Service
						// 			// that.printBoxLabel(oData);
						// 			console.log("COMPLETE222");
						// 		})
						// 		.catch(function (oError) {
						// 			that.setBusy(false);
						// 			messages.responseSplitMessage(oError);
						// 			reject(oError);
						// 		});
						// });

						// var printdata1 = this.Base64Decode(printdata);
					},
					error: function (xhr, status) {
						console.log("ERROR");
					},
					complete: function (xhr, status) {
						console.log("COMPLETE");
					}
				});
			},
			postpdf: function (oUrl, oRequest) {
				var response = "";
				var that = this;
				var aData = $.ajax({
					url: oUrl,
					type: "POST",
					data: oRequest,
					dataType: "json",
					contentType: "application/json;charset=\"utf-8\"",
					Accept: "application/json",

					success: function (data, textStatus, jqXHR) {
						response = data.fileContent;
						// 判断是否是最后一行，PDF预览
						that.getdocument(response);
						// return response;
					},
					error: function (xhr, status) {
						console.log("ERROR");
					},
					complete: function (xhr, status) {
						console.log("COMPLETE");
					}

				});
			},
			
			// 					getitem:function(){
			// this.calltempleate(sUrl,"");
			// 			}
		});

	});