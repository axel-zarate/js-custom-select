# AngularJS Custom Select Directive

Custom auto-complete select box for AngularJS and Bootstrap.

Custom Select is inspired in the AngularJS `select` directive and adds extra functionality such as filtering and item templates.

## Using Custom Select

For the simpler scenarios, using Custom Select is very similar to using the built-in AngularJS `select` directive.

### Simple objects

```HTML
<div custom-select ng-model="fruit" ng-options="f for f in fruits">
</div>
```

### Complex objects

```HTML
<div custom-select ng-model="state" ng-options="s.id as s.name for s in states">
</div>
```

### Enable adding items

```HTML
<div custom-select="growableOptions" ng-model="custom1" ng-options="g for g in growable">
</div>
```

```JS
$scope.growable = ['Item 1', 'Item 2', 'Item 3'];
$scope.growableOptions = {
	addText: 'Add new item',
	onAdd: function () {
		$scope.growable.push('Item ' + ($scope.growable.length + 1));
	}
};
```

### Asynchronous (server-side) filtering

Simply execute your request (using the `$http` service or similar) and replace the items with a new array.

```HTML
<div custom-select="asyncOptions" ng-model="custom2" ng-options="a for a in async">
</div>
```

```JS
$scope.async = ['Item 1', 'Item 2', 'Item 3'];
$scope.asyncOptions = {
	onSearch: function (term) {
		// No search term: restore original items
		if (!term) {
			$scope.async = ['Item 1', 'Item 2', 'Item 3'];
			return;
		}
		
		// Simulate asynchronous call
		$timeout(function () {
			var result = [];
			for (var i = 1; i <= 3; i++)
			{
				result.push(term + ' ' + i);
			}
			$scope.async = result;
		}, 300);
	}
};
```

### Custom item template

Whatever markup you put inside the element decorated with the `custom-select` attribute, acts as an item template. You have access to any AngularJS directive or filter inside this template.

```HTML
<div custom-select ng-model="person" ng-options="t as t.name for t in people">
	<div class="pull-left" style="width: 40px">
		<img ng-src="{{ t.picture }}" style="width: 30px" />
	</div>
	<div class="pull-left">
		<strong>{{ t.name }}</strong><br />
		<span>{{ t.phone }}</span>
	</div>
	<div class="clearfix"></div>
</div>
```

```JS
$scope.people = [
	{ name: 'John Doe', phone: '555-123-456', picture: 'http://www.saintsfc.co.uk/images/common/bg_player_profile_default_big.png' },
	{ name: 'Axel Zarate', phone: '888-777-6666', picture: 'https://avatars0.githubusercontent.com/u/4431445?s=60' },
	{ name: 'Walter White', phone: '303-111-2222', picture: 'http://upstreamideas.org/wp-content/uploads/2013/10/ww.jpg' }
];
```

## Options
Name | Type | Details
---- | ---- | -------
displayText | String | Placeholder text to display in the select box when there is no item is selected. Default: `'Select...'`.
emptyListText | String | Message to display in the dropdown when there source array is empty. Default: `'There are no items to display'`.
emptySearchResultText | String | Message to display in the dropdown when the search filter yields zero results (the difference with `emptyListText` is that there may be items in the data source, but none of them match the search string). Default: `'No results match "$0"'`.
addText | String | Text to display on the add button; additionally, `onAdd` callback function must be supplied. Default: `'Add'`.
onAdd | Function | A callback function to execute when the Add button is pressed. Default: `undefined`.
searchDelay | Integer | Time in milliseconds to wait until the filtering is performed (only used in remote search mode). Default: `1000` (one second).
onSearch | Function | User define search function (usually asynchronous), useful for server-side filtering. The search text is passed as an argument, and the function is expected to replace the source array with new values. Default: `undefined`.
onSelect | Function | Callback function called when the user selects an item from the dropdown.

You can also provide an `ng-change` attribute to the custom select element, which will be wired to the inner `select` element.

## Dependencies
* jQuery
* AngularJS
* Twitter Bootstrap (2.x or 3.x)
