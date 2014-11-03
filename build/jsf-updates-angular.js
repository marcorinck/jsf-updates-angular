/**
 * jua - v0.1.0 - 2014-11-03
 * https://github.com/marcorinck/jsf-updates-angular
 * Copyright (c) 2014 Marco Rinck; Licensed MIT
 */
(function (window, angular, jsf, document, $) {
  'use strict';
  var onCompleteCallbacks = [], requestOngoing = false;
  function escapeJSFClientId(id) {
    return '#' + id.replace(/:/g, '\\:');
  }
  function onCompleteEvent(callback) {
    return function (data) {
      if (data.status === 'begin') {
        onCompleteCallbacks.push(callback);
      }
    };
  }
  function onComplete(callback) {
    onCompleteCallbacks.push(callback);
  }
  function ensureExecutionAfterAjaxRequest(callback) {
    if (!requestOngoing) {
      callback();
    } else {
      onCompleteCallbacks.push(callback);
    }
  }
  function destroyScopes(data) {
    var updates = data.responseXML.getElementsByTagName('update');
    $.each(updates, function (index, update) {
      var id = escapeJSFClientId(update.id);
      if (!id.contains('ViewState')) {
        $(id).find('.ng-scope, .ng-isolate-scope').each(function (index, scopedChildElement) {
          if (window.jua.debug) {
            console.log('destroying child scope for element', scopedChildElement);
          }
          angular.element(scopedChildElement.firstChild).scope().$destroy();
        });
      }
    });
  }
  function handleAjaxUpdates(data) {
    window.setTimeout(function () {
      var $compile = angular.element(document).injector().get('$compile'), updates = data.responseXML.getElementsByTagName('update');
      $.each(updates, function (index, update) {
        var id = escapeJSFClientId(update.id), element;
        if (!id.contains('ViewState')) {
          element = angular.element($(id));
          if (element) {
            if (window.jua.debug) {
              console.log('compiling angular element', element);
            }
          }
          $compile(element)(element.scope());
        }
      });
      if (onCompleteCallbacks.length) {
        onCompleteCallbacks.forEach(function (onCompleteCallback) {
          onCompleteCallback();
        });
        onCompleteCallbacks = [];
      }
    });
  }
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
}(window, angular, jsf, document, jQuery));