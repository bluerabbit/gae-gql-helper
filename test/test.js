module("setup", {
	setup: function() {
		localStorage.removeItem('options');
	},
	teardown: function () {
		localStorage.removeItem('options');
	}
});

test("Options.load", function() {
	var options = Options.load();
	same(options.apps.length, 0);
});

test("Options.save", function() {
	var options = Options.load();
	var app = options.getApp('a');
	same(app != null, true);
	same(app.appId, 'a');
	same(app.gqlHistory.length, 0);
	same(app.schemaList.length, 0);

	app.gqlHistory.push({gql:'select * from emp', namespace:'', star:false});
	options.apps.push(app);
	options.save();

	options = Options.load();
	app = options.getApp('a');
	same(app.gqlHistory.length, 1);
});


test("addHistoryで追加した際にlimitを超える場合は削除される事。但し、starがtrueの分は削除されないこと", function() {
	var list = [{gql:'5', namespace:'', star:false},
							 {gql:'4', namespace:'', star:false},
							 {gql:'3', namespace:'', star:false},
							 {gql:'2', namespace:'', star:false},
							 {gql:'1', namespace:'', star:true}];

	list = addHistory(list, {gql:'6', namespace:'', star:false}, 5);
	same(list.length, 5);
	same(list[0].gql, '6');
	same(list[1].gql, '5');
	same(list[2].gql, '4');
	same(list[3].gql, '3');
	same(list[4].gql, '1');
});

test("addHistoryでlimitより少ない場合は履歴が削除されない", function() {
	var list = [{gql:'5', namespace:'', star:false},
							 {gql:'4', namespace:'', star:false},
							 {gql:'3', namespace:'', star:true},
							 {gql:'2', namespace:'', star:false},
							 {gql:'1', namespace:'', star:true}];

	list = addHistory(list, {gql:'6', namespace:'', star:false}, 10);
	same(list.length, 6);
	same(list[0].gql, '6');
	same(list[1].gql, '5');
	same(list[2].gql, '4');
	same(list[3].gql, '3');
	same(list[4].gql, '2');
	same(list[5].gql, '1');
});

test("addHistoryでlimitを超えた場合は履歴が削除される", function() {
	var list = [{gql:'5', namespace:'', star:false},
							 {gql:'4', namespace:'', star:false},
							 {gql:'3', namespace:'', star:true},
							 {gql:'2', namespace:'', star:false},
							 {gql:'1', namespace:'', star:true}];

	list = addHistory(list, {gql:'6', namespace:'', star:false}, 3);
	same(list.length, 3);
	same(list[0].gql, '6');
	same(list[1].gql, '3');
	same(list[2].gql, '1');
});

test("addHistoryでlimitを超えた場合は履歴が削除される。しかし、starがtrueのものは削除されない。直近に追加したものは削除しない", function() {
	var list = [{gql:'5', namespace:'', star:false},
							 {gql:'4', namespace:'', star:true},
							 {gql:'3', namespace:'', star:true},
							 {gql:'2', namespace:'', star:false},
							 {gql:'1', namespace:'', star:true}];

	list = addHistory(list, {gql:'6', namespace:'', star:false}, 3);
	same(list.length, 4);
	same(list[0].gql, '6');
	same(list[1].gql, '4');
	same(list[2].gql, '3');
	same(list[3].gql, '1');
});

function addHistory(list, gql, limit) {
	list.unshift(gql); // {gql:'', namespace:'', star:false }

	var delHistoryCount = list.length - limit;
	if (delHistoryCount > 0) {
		var delList = [];
		// 昇順で古いのをスキップして再度listを作り直す
		list = $.map(list.reverse(), function (e, i) {
			if (!e.star && delHistoryCount > delList.length && !(gql === e)) {
				delList.push(e);
				return null;
			}
	  	return e;
		});
		console.log(delList);
		list.reverse(); // 降順にする
	}
	return list;
}