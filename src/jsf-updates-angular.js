/* global jsf: true, angular: true */
(function (window, angular, jsf, document) {
	"use strict";

	var onCompleteCallbacks = [];

	function escapeJSFClientId() {

	}

	/**
	 * Adds the given callback to be executed after a JSF ajax request is successfully completed.
	 *
	 * This function is intended to
	 * be used as a parameter for the onevent attribut of a f:ajax component. As f:ajax onevent calls the given callback
	 * always 3 times for every ajax event this needs to be handled
	 * @param {Function} callback
	 * @returns {Function}
	 */
	function onCompleteEvent(callback) {
		return function (data) {
			if (data.status === 'begin') {
				onCompleteCallbacks.push(callback);
			}
		};
	}


	/**
	 * Adds the given callback to be executed after the next (or currently ongoing) JSF ajax request is successfully
	 * completed.
	 *
	 * @param {Function} callback
	 * @returns {Function}
	 */
	function onComplete(callback) {
		onCompleteCallbacks.push(callback);
	}

	function destroyScopes(data) {
		var updates = data.responseXML.getElementsByTagName("update");

		if (updates) {
			updates.forEach(function(updateId) {
				var id = escapeJSFClientId(updateId), element, scopedElements;

				if (!id.contains("ViewState")) {
					element = document.getElementById(id);
					scopedElements = element.querySelectorAll('.ng-scope, .ng-isolated-scope');

					scopedElements.forEach(function (scopedChildElement) {
						if (window.jua.debug) {
							console.log("destroying child scope for element", scopedChildElement);
						}

						angular.element(scopedChildElement.firstChild).scope().$destroy();
					});
				}
			});
		}
	}

	function handleAjaxUpdates(data) {
		window.setTimeout(function () {
			var $compile = angular.element(document).injector().get('$compile'),
				updates = data.responseXML.getElementsByTagName("update");

			if (updates) {
				updates.forEach(function(updateId) {
					var id = escapeJSFClientId(updateId), element;

					if (!id.contains("ViewState")) {
						element = angular.element(document.getElementById(id));

						if (element) {
							if (window.jua.debug) {
								console.log("compiling angular element", element);
							}

							$compile(element)(element.scope());
						}
					}
				});
			}

			if (onCompleteCallbacks.length) {
				onCompleteCallbacks.forEach(function(onCompleteCallback) {
					onCompleteCallback();
				});

				onCompleteCallbacks = [];
			}
		});
	}

	window.addEventListener("load", function () {
		if (jsf) {
			jsf.ajax.addOnEvent(function (data) {
				if (data.status === 'begin') {
					onCompleteCallbacks = [];
				}

				if (data.status === 'complete') {
					destroyScopes(data);
				}

				if (data.status === 'success') {
					handleAjaxUpdates(data);
				}
			});
		}

	});

	var jua = {
		onComplete: onComplete,
		onCompleteEvent: onCompleteEvent
	};

	if (typeof window.module !== 'undefined' && window.module.exports) {//commonJS
		window.module.exports = jua;
	} else if (typeof window.define === 'function' && window.define.amd) {//amd
		window.define("jua", function () {
			return jua;
		});
	} else {
		window.jua = jua;
	}
})(window, angular, jsf, document);