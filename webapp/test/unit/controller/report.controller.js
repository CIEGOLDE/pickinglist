/*global QUnit*/

sap.ui.define([
	"cie/pickinglist/controller/report.controller"
], function (Controller) {
	"use strict";

	QUnit.module("report Controller");

	QUnit.test("I should test the report controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});