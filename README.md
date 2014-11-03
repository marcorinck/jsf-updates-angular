#JSF-Updates-Angular (JUA)

Update angularJS after JSF Ajax requests are complete

This small library updates angularJS state after a JSF AJAX request is complete. You can use angularJS directives
in a JSF page now without worrying that JSF AJAX requests updates elements with new angularJS directives that are 
not picked up by angularjS because DOM changes were happening outside of angularJS digest phase.

An introduction can be found here: http://entwicklertagebuch.com/blog/2014/11/jsf-updates-angular-how-to-use-angularjs-directives-to-replace-jsf-components/


##Requirements

* ES5 browser (all modern browsers and IE9+).
* JSF 2.x (tested with Mojarra JSF 2.1.7)
* angularJS (tested with 1.3, older versions should work too)

##Installation

````html
<script src="jsf-updates-angular.js"></script>
````

##Usage 

After including jsf-updates-angular.js in your JSF page, all JSF AJAX requests which update DOM nodes will be automatically handled by angularJS and will be compiled by angularJS $compile service. angularJS scopes which were inside those elements will be automatically destroyed by angularJS - $destroy() method is called on them. 

JUA does not include any directive by itself. If you want to replace PrimeFaces or whatever you have to write your own directives. 

However, JUA has 3 utility functions you can use. All functions are registered inside the *jua* global object.

###onComplete
>{Function} jua.onComplete(callback)

This function registers the given callback function to be executed after the next JSF AJAX request was successfully completed and angularJS is finished compiling the updated DOM nodes.

If no request is currently running, it will not be run at all. 

The intention of this method is, that its used together with f:ajax component or Omnifaces.Ajax.oncomplete() on the server side or any other mechanism, to run javascript after the current JSF AJAX request is finished. 

###onCompleteEvent

>{Function} jua.onCompleteEvent(callback)

This function registers the given callback function to be executed after the next JSF AJAX request was successfully completed and angularJS is finished compiling the updated DOM nodes.

If no request is currently running, it will not be run at all. 

The intention of this method is, that its used together especially with f:ajax component onevent attribute. The method that is given to the onevent attribute of f:ajax is always called 3 times, regardless if you only want it to be run only once. This method handles that.

###ensureExecutionAfterAjaxRequest

>{Function} jua.ensureExecutionAfterAjaxRequest(callback)

This function will run the given callback function safely outside any JSF AJAX request. When a request is currently running and maybe the DOM is in an undefined state, the callback will be run after the request is succesfully completed and angularJS is finished compiling the updated DOM nodes.   

If no request is currently running, the callback will be run immediately.

The intention of this method is, that methods can be sure, that no JSF AJAX request is running currently and that the DOM is in a clearly defined stage. Because of asynchronous behaviour of ajax requests and updating of DOM nodes afterwards, I had to make sure in my own directives that the DOM was ready to be used again.

###debug mode

>{boolean} jua.debug (default: false)

When debug mode is active, JUA will log every DOM node that is compiled and every scope that is destroyed by angularJS to the console. 

###check if JSF AJAX request is ongoing

>{boolean} jua.requestOngoing

This attribute is true when an JSF AJAX request is currently ongoing or is already finished but not all DOM updates, angularJS compiling and onComplete callbacks are done.

