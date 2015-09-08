# AngularJS Custom Select Directive

Custom auto-complete select box for AngularJS and Bootstrap.

Custom Select is inspired in the AngularJS `select` directive and adds extra functionality such as filtering and item templates.

Unlike many other autocomplete controls out there, this one is designed to work well with Id/Value objects, where you care about the Id in your model but you want to display a different value in the view.

## Using Custom Select

For the simpler scenarios, using Custom Select is very similar to using the built-in AngularJS `select` directive. For client-side filtering, you can use a regular Angular filter in conjunction with the `$searchTerm` local variable provided by the custom select, which corresponds to the text entered into the search textbox; or you can use a function in your `$scope` that implements a custom filtering logic and returns the filtered items.

### Simple objects

```HTML
<div custom-select="f for f in fruits | filter: $searchTerm" ng-model="fruit">
</div>
```

### Complex objects

```HTML
<div custom-select="s.id as s.name for s in states | filter: { name: $searchTerm }" ng-model="state">
</div>
```

### Custom filtering

```HTML
<div custom-select="p as p.name for p in findPeople($searchTerm)" ng-model="state">
</div>
```

```JS
$scope.findPeople = function (term) {
	// Suppose we have a people array
	var found = [];
	for (var i = 0; i < people.length; i++) {
		if (/* search all properties you like */) {
			found.push(people[i]);
		}
	}
	return found;
};
```

### Enable adding items

```HTML
<div custom-select="g for g in growable | filter: $searchTerm" ng-model="custom1" custom-select-options="growableOptions">
</div>
```

```JS
$scope.growable = ['Item 1', 'Item 2', 'Item 3'];
$scope.growableOptions = {
	addText: 'Add new item',
	onAdd: function () {
		var newItem = 'Item ' + ($scope.growable.length + 1);
		$scope.growable.push(newItem);
		return newItem;
	}
};
```

### Asynchronous (server-side) filtering

You need to use a function just as you would for a custom filter, with the difference that, given the asynchronous nature of AJAX, such function must return a promise. As soon as the promise is resolved, the new items (if any) are displayed inside the list.

```HTML
<div custom-select="a for a in searchAsync($searchTerm)" ng-model="custom2">
</div>
```

```JS
$scope.searchAsync = function (term) {
	// No search term: return some default items
	if (!term) {
		return  ['Item 1', 'Item 2', 'Item 3'];
	}
	var deferred = $q.defer();
	// Simulate an $http call
	$timeout(function () {
		var result = [];
		for (var i = 1; i <= 3; i++)
		{
			result.push(term + ' ' + i);
		}
		deferred.resolve(result);
	}, 300);
	return deferred.promise;
};
```

### Custom item template

Whatever markup you put inside the element decorated with the `custom-select` attribute, acts as an item template. You have access to any AngularJS directive or filter inside this template.

```HTML
<div custom-select="t as t.name for t in people | filter: { name: $searchTerm }" ng-model="person">
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
onSelect | Function | Callback function called when the user selects an item from the dropdown.

## Dependencies
* jQuery
* AngularJS
* Twitter Bootstrap (2.x or 3.x)
