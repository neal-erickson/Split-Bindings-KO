(function ($) {

	if (ko.splitBindingProvider != undefined) return;

	if (!ko) throw new Error('Knockout JS must be loaded');

	ko.splitBindingProvider = function (defaultBindingProvider) {
		this.splitBindingAttributePrefix = "data-bind-";
		this.defaultBindingProvider = defaultBindingProvider ? defaultBindingProvider : ko.bindingProvider.instance;

		this.nodeHasBindings = function (node) {
			switch (node.nodeType) {
				case 1: // Element node
					// Check if we have a standard KO "data-bind" attribute - use that if needed
					if (this.defaultBindingProvider.nodeHasBindings(node)) return true;
					// Otherwise look for data-bind-* attributes
					return this.checkNodeForSplitDataBindAttributes(node.attributes);
				case 8: // Comment node - handled the default way
					return this.defaultBindingProvider.nodeHasBindings(node);
				default: return false;
			}
		};

		// Iterate through attributes, searching for "data-bind-*" names
		this.checkNodeForSplitDataBindAttributes = function (attributes) {
			for (var i = 0; i < attributes.length; i++) {
				if (this.attributeIsSplitBinding(attributes[i].nodeName)) return true;
			}
			return false; // no data-bind-* to be found
		};

		this.attributeIsSplitBinding = function (attributeName) {
			//return attributeName.substring(0, this.customBindingAttributeName.length) === this.customBindingAttributeName;
			return attributeName.lastIndexOf(this.splitBindingAttributePrefix, 0) === 0;
		};

		// This fxn returns a bindings object representing that active bindings for a given node
		this.getBindings = function (node, bindingContext) {

			// Check if we should use "old-school" KO data-bind attribute mechanism
			if (this.defaultBindingProvider.nodeHasBindings(node)) {
				return this.defaultBindingProvider.getBindings(node, bindingContext);
			}

			// Get split data-bind attributes
			var bindingsString = "";
			for (var i = 0; i < node.attributes.length; i++) {
				if (this.attributeIsSplitBinding(node.attributes[i].nodeName)) {
					if (i > 0) bindingsString += ',';
					bindingsString +=
						node.attributes[i].nodeName.substring(this.splitBindingAttributePrefix.length) + ':' + node.attributes[i].nodeValue;
				}
			}

			// If the bindings were legitimate, leverage the ko binding providers parse bindings string method
			return bindingsString ? ko.bindingProvider.prototype.parseBindingsString(bindingsString, bindingContext) : null;
		};
	};
})(jQuery);