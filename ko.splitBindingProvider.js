(function ($) {

	// Prevent multiple loading
	if (ko.splitBindingProvider != undefined) return;

	// Sanity check (should be obvious)
	if (!ko) throw new Error('Knockout JS must be loaded');

	// Custom binding provider ctor declaration
	//
	// A custom binding provider must provide two functions:
	//   --> 'nodeHasBindings(node)'
	//   --> 'getBindings(node, bindingContext)'
	ko.splitBindingProvider = function () {
		var sbp = this;

		// Split attributes begin with this (e.g. 'data-bind-text')
		sbp.splitBindingAttributePrefix = "data-bind-";
		// Leverages the default instance of the ko binding provider
		sbp.defaultBindingProvider = ko.bindingProvider.instance;

		// Internal : determines if the attribute is a split binding.
		// .lastIndexOf() is supposed to be moderately fast
		sbp.attributeIsSplitBinding = function (attributeName) {
			return attributeName.lastIndexOf(sbp.splitBindingAttributePrefix, 0) === 0;
		};

		// Iterate through attributes, searching for "data-bind-*" names
		sbp.checkNodeForSplitDataBindAttributes = function (attributes) {
			for (var i = 0; i < attributes.length; i++) {
				if (sbp.attributeIsSplitBinding(attributes[i].nodeName)) return true;
			}
			return false; // no data-bind-* to be found
		};

		// Called by ko to find nodes that must be data bound
		sbp.nodeHasBindingsInternal = function (node) {
			switch (node.nodeType) {
				case 1: // Element node
					// Check if we have a standard KO "data-bind" attribute - use that first
					if (sbp.defaultBindingProvider.nodeHasBindings(node)) return true;
					// Otherwise look for data-bind-* attributes
					return sbp.checkNodeForSplitDataBindAttributes(node.attributes);
				case 8: // Comment node - handled the default way
					return sbp.defaultBindingProvider.nodeHasBindings(node);
				default: return false;
			}
		};

		// Debugging : just print comparison
		sbp.nodeHasBindings = function(node) {
			var hasBindingsInternal = sbp.nodeHasBindingsInternal(node);
			var hasBindings = sbp.defaultBindingProvider.nodeHasBindings(node);
			console.log('hasBindings -->', 'ko', hasBindings, 'sbp', hasBindingsInternal);
			//return hasBindings; // default for now
			return sbp.nodeHasBindingsInternal(node);
		};

		// This fxn returns a bindings object representing that active bindings for a given node
		sbp.getBindings = function (node, bindingContext) {

			var originalBindings = sbp.defaultBindingProvider.getBindings(node, bindingContext);

			console.log('og:', originalBindings);

			// Check if we should use "old-school" KO data-bind attribute mechanism
			if (sbp.defaultBindingProvider.nodeHasBindings(node)) {
				//return sbp.defaultBindingProvider.getBindings(node, bindingContext);
				return originalBindings;
			}

			// Get split data-bind attributes
			var bindingsString = "";
			for (var i = 0; i < node.attributes.length; i++) {
				if (sbp.attributeIsSplitBinding(node.attributes[i].nodeName)) {
					if (i > 0) bindingsString += ',';
					bindingsString +=
						node.attributes[i].nodeName.substring(sbp.splitBindingAttributePrefix.length) + ':' + node.attributes[i].nodeValue;
				}
			}

			// BIG PROBLEMO : Binding cache is undefined...
			// If the bindings were legitimate, leverage the ko binding providers parse bindings string method
			return bindingsString ? sbp.defaultBindingProvider.parseBindingsString(bindingsString, bindingContext) : null;
		};
	};
})(jQuery);