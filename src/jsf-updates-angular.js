(function (window, document) {
	'use strict';

	var angular, jsf,
		onCompleteCallbacks = [],
		requestOngoing = false;

	function escapeJSFClientId(id) {
		return '#' + id.replace(/:/g, "\\:");
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
			if (data.status === 'complete') {
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

	function destroyScopedElements(elementsWithScope) {
		var i, length;

		if (elementsWithScope && elementsWithScope.length) {
			length = elementsWithScope.length;

			for (i = 0; i < length; i++) {
				if (window.jua.debug) {
					console.log('destroying child scope for element', elementsWithScope[i]);
				}

				angular.element(elementsWithScope[i].firstChild).scope().$destroy();
			}
		}
	}

	function destroyScopes(data) {
		var updates = data.responseXML.getElementsByTagName('update'), length = updates.length, i, id;

		for (i = 0; i < length; i++) {
			id = escapeJSFClientId(updates[i].id);

			if (!id.contains("ViewState")) {
				destroyScopedElements(document.querySelector(id).querySelectorAll('.ng-scope, .ng-isolate-scope'));
			}
		}
	}

	function handleAjaxUpdates(data) {
		window.setTimeout(function () {
			var $compile = angular.element(document).injector().get('$compile'),
				updates = data.responseXML.getElementsByTagName('update'),
				length = updates.length,
				i, id, element;

			for (i = 0; i < length; i++ ) {
				id = escapeJSFClientId(updates[i].id);

				if (!id.contains('ViewState')) {
					element = angular.element(document.querySelector(id));

					if (element) {
						if (window.jua.debug) {
							console.log('compiling angular element', element);
						}

						$compile(element)(element.scope());
					}
				}
			}

			if (onCompleteCallbacks.length) {
				onCompleteCallbacks.forEach(function (onCompleteCallback) {
					onCompleteCallback();
				});
				onCompleteCallbacks = [];
			}
		});
	}

	jsf = window.jsf;
	angular = window.angular;

	if (jsf && angular) {
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

		window.jua = {
			onComplete: onComplete,
			onCompleteEvent: onCompleteEvent,
			ensureExecutionAfterAjaxRequest: ensureExecutionAfterAjaxRequest,
			get requestOngoing() {
				return requestOngoing;
			}
		};
	} else {
		if (console && console.warn) {
			console.warn('jsf-updates-angular: no jsf javascript or no angular found. Doing nothing.');
		}
	}
})(window, document);