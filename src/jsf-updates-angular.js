/* global jsf: true, angular: true */
(function (window, angular, jsf, document) {
	"use strict";

	var onCompleteCallbacks = [],
		requestOngoing = false;

	function escapeJSFClientId(id) {
		return "#" + id.replace(/:/g, "\\:");
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

	/**
	 * Executes the given callback immediately when no JSF AJAX request is currently running or executes after JSF AJAX request
	 * is successfully completed.
	 *
	 * @param callback
	 */
	function ensureExecutionAfterAjaxRequest(callback) {
		if (!requestOngoing) {
			callback();
		} else {
			onCompleteCallbacks.push(callback);
		}
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
					requestOngoing = true;
					onCompleteCallbacks = [];
				}

				if (data.status === 'complete') {
					destroyScopes(data);
				}

				if (data.status === 'success') {
					handleAjaxUpdates(data);
					requestOngoing = false;
				}
			});
		}

	});

	window.jua = {
		onComplete: onComplete,
		onCompleteEvent: onCompleteEvent,
		ensureExecutionAfterAjaxRequest: ensureExecutionAfterAjaxRequest,
		get requestOngoing() {
			return requestOngoing;
		}
	};
})(window, angular, jsf, document);