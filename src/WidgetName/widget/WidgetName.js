/*global logger*/
/*
    WidgetName
    ========================

    @file      : WidgetName.js
    @version   : {{version}}
    @author    : {{author}}
    @date      : {{date}}
    @copyright : {{copyright}}
    @license   : {{license}}

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "dojo/text!WidgetName/widget/template/WidgetName.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoEvent, widgetTemplate) {
    "use strict";

    // Declare widget's prototype.
    return declare("WidgetName.widget.WidgetName", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        contentNode: null,

        // Parameters configured in the Modeler.
        documentation: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _alertDiv: null,
        _readOnly: false,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            console.debug(this.id + ".constructor");
            this._handles = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            console.debug(this.id + ".postCreate");

            if (this.readOnly || this.get("disabled") || this.readonly) {
              this._readOnly = true;
            }

            this._updateRendering();
            this._setupEvents();
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            console.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {
            console.debug(this.id + ".enable");
        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {
            console.debug(this.id + ".disable");
        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {
            console.debug(this.id + ".resize");
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
            console.debug(this.id + ".uninitialize");
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

        // Fetch all attributes before rendering.
        // Need to do fetches in case attributes reside on paths
        // Will construct convenience accessor methods
        // Be sure to add this.dataObject = {} to update method
        // Example: if you have this.name Attribute, you will access
        //  it via this.nameAttribute.get() and this.nameAttribute.get()
        // attributes: string[]
        _fetchAttributes: function(attributes) {
            if (this._contextObj && (attributes.length)) {
                var attribute = attributes.pop();
                if (this[attribute].indexOf('/') == -1) {
                    this._createAttribute(this._contextObj, attribute);
                } else {
                    var parts = this.codeAttribute.split('/'),
                        attribute = parts.pop();
                    this._contextObj.fetch(this[attribute+'Object'].path, dojo.hitch(this, function (attribute, path, object) {
                        this._createAttribute(object, attribute, path);
                    }, attribute. parts.join('/')));
                }
                this._fetchAttributes(attributes);
            // Finished parsing attributes, can render now..
            } else if (this._contextObj) {
                this._resetSubscriptions();
                this._updateRendering();
            } else {
                this._attributes = [];
            }
        },

        // Helper method to create attribute
        _createAttribute: function (object, attribute, path) {
            var attributeObject = {
                get: function() {
                    return this.object.get(this.attribute);
                },
                set: function(value) {
                    return this.object.set(this.attribute, value);
                }
            };
            attributeObject.path = path;
            attributeObject.attribute = attribute;
            attributeObject.object = object;
            this[attribute+'Attribute'] = attributeObject;
            this._attributes.push(attributeObject);
        },

        // We want to stop events on a mobile device
        _stopBubblingEventOnMobile: function (e) {
            logger.debug(this.id + "._stopBubblingEventOnMobile");
            if (typeof document.ontouchstart !== "undefined") {
                dojoEvent.stop(e);
            }
        },

        // Attach events to HTML dom elements
        _setupEvents: function () {
            logger.debug(this.id + "._setupEvents");

            this.connect(this.infoTextNode, "click", function (e) {
                // Only on mobile stop event bubbling!
                this._stopBubblingEventOnMobile(e);
            });
        },

        // Rerender the interface.
        _updateRendering: function (callback) {
            console.debug(this.id + "._updateRendering");

            if (this._contextObj !== null) {

            } else {
                dojoStyle.set(this.domNode, "display", "none");
            }

            // Important to clear all validations!
            this._clearValidations();

            // The callback, coming from update, needs to be executed, to let the page know it finished rendering
            mendix.lang.nullExec(callback);
        },

        // Handle validations.
        _handleValidation: function (validations) {
            console.debug(this.id + "._handleValidation");
            this._clearValidations();

            // TODO: Need to review this, not sure how it works with multiple subscriptions
            var validation = validations[0],
                message = validation.getReasonByAttribute(this.backgroundColor);

            if (this._readOnly) {
                dojoArray.forEach(this._attributes, dojo.hitch(this, function(validation, attribute) {
                    validation.removeAttribute(attribute.attribute);
                }, validation));
            } else if (message) {
                this._addValidation(message);
                validation.removeAttribute(this.backgroundColor);
            }
        },

        // Clear validations.
        _clearValidations: function () {
            console.debug(this.id + "._clearValidations");
            dojoConstruct.destroy(this._alertDiv);
            this._alertDiv = null;
        },

        // Show an error message.
        _showError: function (message) {
            console.debug(this.id + "._showError");
            if (this._alertDiv !== null) {
                dojoHtml.set(this._alertDiv, message);
                return true;
            }
            this._alertDiv = dojoConstruct.create("div", {
                "class": "alert alert-danger",
                "innerHTML": message
            });
            dojoConstruct.place(this._alertDiv, this.domNode);
        },

        // Add a validation.
        _addValidation: function (message) {
            console.debug(this.id + "._addValidation");
            this._showError(message);
        },

        _unsubscribe: function () {
          if (this._handles) {
              dojoArray.forEach(this._handles, function (handle) {
                  mx.data.unsubscribe(handle);
              });
              this._handles = [];
          }
        },

        // Reset subscriptions.
        _resetSubscriptions: function () {
            console.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            this._unsubscribe();

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                dojoArray.forEach(this._attributes, dojo.hitch(this, function(attribute) {
                    var attrHandle = mx.data.subscribe({
                        guid: attribute.object.getGuid(),
                        attr: attribute.attribute,
                        callback: dojoLang.hitch(this, function (guid, attr, attrValue) {
                            this._updateRendering();
                        })
                    });
                    this._handles.push(attrHandle);
                }));
                var objectHandle = mx.data.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: dojoLang.hitch(this, function (guid) {
                        this._updateRendering();
                    })
                });
                this._handles.push(objectHandle);
                var validationHandle = mx.data.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: dojoLang.hitch(this, this._handleValidation)
                });
                this._handles.push(validationHandle);
            }
        }
    });
});

require(["WidgetName/widget/WidgetName"]);
