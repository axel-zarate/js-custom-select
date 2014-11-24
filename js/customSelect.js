(function (angular, undefined) {
	'use strict';

	// TODO: Move to polyfill?
	if (!String.prototype.trim) {
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g, '');
		};
	}

	var module = angular.module('AxelSoft', []);

	module.value('customSelectDefaults', {
		displayText: 'Select...',
		emptyListText: 'There are no items to display',
		emptySearchResultText: 'No results match "$0"',
		addText: 'Add',
		searchDelay: 1000
	});
	
	module.directive('customSelect', ['$parse', '$compile', '$timeout', 'customSelectDefaults', function ($parse, $compile, $timeout, baseOptions) {
		var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/;
		
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function (scope, elem, attrs, controller) {
				if (!attrs.ngOptions) {
					throw new Error('Expected ng-options attribute.');
				}

				var match = attrs.ngOptions.match(NG_OPTIONS_REGEXP);

				if (!match) {
					throw new Error("Expected expression in form of " +
						"'_select_ (as _label_)? for (_key_,)?_value_ in _collection_'" +
						" but got '" + attrs.ngOptions + "'.");
				}

				elem.addClass('dropdown custom-select');

				// Ng-Options break down
				var displayFn = $parse(match[2] || match[1]),
					valueName = match[4] || match[6],
					valueFn = $parse(match[2] ? match[1] : valueName),
					values = match[7],
					valuesFn = $parse(values);

				var options = getOptions(),
					searchModel = match[2] ? (match[2]).replace(new RegExp('^' + valueName + '\\.'), 'search.') : 'search',
					remoteSearch = typeof options.onSearch === 'function',
					timeoutHandle,
					lastSearch = '',
					focusedIndex = -1,
					getInitialSearchModel = function () {
						return match[2] ? {} : '';
					};

				var itemTemplate = elem.html().trim() || '{{' + (match[2] || match[1]) + '}}',

					selectTemplate = '<select class="hide" ng-options="' + attrs.ngOptions + '" ng-model="' + attrs.ngModel + '" ' + (attrs.ngChange ? 'ng-change="' + attrs.ngChange + '"' : '') + '></select>',
					dropdownTemplate =
					'<a class="dropdown-toggle" data-toggle="dropdown" href ng-class="{ disabled: disabled }">' +
						'<span>{{displayText}}</span>' +
						'<b></b>' +
					'</a>' +
					'<div class="dropdown-menu">' +
						'<div stop-propagation="click" class="custom-select-search">' +
							'<input class="' + attrs.selectClass + '" type="text" autocomplete="off" ng-model="' + searchModel + '" />' +
						'</div>' +
						'<ul role="menu">' +
							'<li role="presentation" ng-repeat="' + valueName + ' in ' + values + (remoteSearch ? '' : ' | filter: search') + '">' +
								'<a role="menuitem" tabindex="-1" href ng-click="select(' + valueName + ')">' +
									itemTemplate +
								'</a>' +
							'</li>' +
							'<li ng-hide="(' + values + (remoteSearch ? '' : ' | filter: search') + ').length" class="empty-result" stop-propagation="click">' +
								'<em class="muted">' +
									'<span ng-hide="' + searchModel + '">{{emptyListText}}</span>' +
									'<span class="word-break" ng-show="' + searchModel + '">{{emptySearchResultText | format:' + searchModel + '}}</span>' +
								'</em>' +
							'</li>' +
						'</ul>' +
						'<div class="custom-select-action">' +
							(typeof options.onAdd === "function" ?
							'<button type="button" class="btn btn-primary btn-block add-button" ng-click="add()">{{addText}}</button>' : '') +
						'</div>' +
					'</div>';

				// Clear element contents
				elem.empty();

				// Create hidden select element
				var selectElement = angular.element(selectTemplate);

				// Create dropdown element
				var dropdownElement = angular.element(dropdownTemplate),
					anchorElement = dropdownElement.eq(0).dropdown(),
					inputElement = dropdownElement.eq(1).find(':text'),
					ulElement = dropdownElement.eq(1).find('ul');

				// Create child scope for input and dropdown
				var childScope = scope.$new(true);
				configChildScope();

				// Click event handler to set initial values and focus when the dropdown is shown
				anchorElement.on('click', function (event) {
					if (childScope.disabled) {
						return;
					}
					if (!remoteSearch) {
						childScope.$apply(function () {
							lastSearch = '';
							childScope.search = getInitialSearchModel();
						});
					}
					focusedIndex = -1;
					inputElement.focus();
				});

				// Event handler for key press (when the user types a character while focus is on the anchor element)
				anchorElement.on('keypress', function (event) {
					if (!(event.altKey || event.ctrlKey)) {
						anchorElement.click();
					}
				});

				// Event handler for Esc, Enter, Tab and Down keys on input search
				inputElement.on('keydown', function (event) {
					if (!/(13|27|40|^9$)/.test(event.keyCode)) return;
					event.preventDefault();
					event.stopPropagation();

					switch (event.keyCode) {
						case 27: // Esc
							anchorElement.dropdown('toggle');
							break;
						case 13: // Enter
							selectFromInput();
							break;
						case 40: // Down
							focusFirst();
							break;
						case 9:// Tab
							anchorElement.dropdown('toggle');
							break;
					}
				});

				// Event handler for Up and Down keys on dropdown menu
				ulElement.on('keydown', function (event) {
					if (!/(38|40)/.test(event.keyCode)) return;
					event.preventDefault();
					event.stopPropagation();

					var items = ulElement.find('li > a');

					if (!items.length) return;
					if (event.keyCode == 38) focusedIndex--;                                    // up
					if (event.keyCode == 40 && focusedIndex < items.length - 1) focusedIndex++; // down
					//if (!~focusedIndex) focusedIndex = 0;

					if (focusedIndex >= 0) {
						items.eq(focusedIndex)
							.focus();
					} else {
						focusedIndex = -1;
						inputElement.focus();
					}
				});

				// Compile select element
				$compile(selectElement)(scope);
				elem.append(selectElement);

				// Compile template against child scope
				$compile(dropdownElement)(childScope);
				elem.append(dropdownElement);

				// When model changes outside of the control, update the display text
				controller.$render = function () {
					// Added a timeout to allow for the inner select element
					// to respond to the model change and update the selected option
					$timeout(setDisplayText, 50);
				};

				// Watch for changes in the default display text
				childScope.$watch(getDisplayText, setDisplayText);

				childScope.$watch(function () { return elem.attr('disabled'); }, function (value) {
					childScope.disabled = value;
				});

				// Watch for changes on the original values and update the isolated child scope accordingly
				scope.$watch(values, function (value) {
					// childScope[values] = value;
					valuesFn.assign(childScope, value);
				});

				function setDisplayText() {
					var collection,
						locals = {},
						text = undefined,
						key = selectElement.val();

					if (key && key !== '?') {
						collection = valuesFn(childScope) || [];
						locals[valueName] = collection[key];
						text = displayFn(childScope, locals);
					}

					childScope.displayText = text || options.displayText;
				}

				function getOptions() {
					return angular.extend({}, baseOptions, scope.$eval(attrs.customSelect));
				}

				function getDisplayText() {
					options = getOptions();
					return options.displayText;
				}

				function focusFirst() {
					var opts = ulElement.find('li > a');
					if (opts.length > 0) {
						focusedIndex = 0;
						opts.eq(0).focus();
					}
				}

				// Selects the first element on the list when the user presses Enter inside the search input
				function selectFromInput() {
					var opts = ulElement.find('li > a');
					if (opts.length > 0) {
						var ngRepeatItem = opts.eq(0).scope();
						var item = ngRepeatItem[valueName];
						childScope.$apply(function () {
							childScope.select(item);
						});
						anchorElement.dropdown('toggle');
					}
				}

				function configChildScope() {
					childScope.addText = options.addText;
					childScope.emptySearchResultText = options.emptySearchResultText;
					childScope.emptyListText = options.emptyListText;

					childScope.select = function (item) {
						var locals = {};
						locals[valueName] = item;
						var value = valueFn(childScope, locals);
						//setDisplayText(displayFn(scope, locals));
						childScope.displayText = displayFn(childScope, locals) || options.displayText;
						controller.$setViewValue(value);

						childScope.search = getInitialSearchModel();
						anchorElement.focus();

						typeof options.onSelect === "function" && options.onSelect(item);
					};
					childScope.add = function () {
						options.onAdd(childScope.select);
					};

					if (remoteSearch) {
						inputElement.attr('ng-change', 'onSearch(' + searchModel + ')');
						childScope.onSearch = function (term) {
							if (timeoutHandle) {
								timeoutHandle = $timeout.cancel(timeoutHandle);
							}

							term = (term || '').trim();

							timeoutHandle = $timeout(function () {
								timeoutHandle = $timeout.cancel(timeoutHandle);

								if (term != lastSearch) {
									options.onSearch((lastSearch = term));
								}
							},
							// If empty string, do not delay
							(term && options.searchDelay) || 0);
						};
					}

					setDisplayText();
				}
			}
		};
	}]);

	module.directive('stopPropagation', function () {
		return {
			restrict: 'A',
			link: function (scope, elem, attrs, ctrl) {
				var events = attrs['stopPropagation'];
				elem.bind(events, function (event) {
					event.stopPropagation();
				});
			}
		};
	});
})(angular);