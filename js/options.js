var Options = function (values, storageKey){
	this._storageKey = storageKey || 'options';
	values = values || {
		apps:[], // [{appId:'',
				 //   star:false,
				 //   gqlHistory:[ {gql:'', namespace:'', star:false} ],
				 //   schemaList:[ {kind:'',  properties:[{name:'age', type:'int'}] } ]
				 // }];
		schemaVersion:3
	};

	// migration
	if (values.schemaVersion != 3) {
		values.apps = [];
		values.schemaVersion = 3;
	}

	var self = this;
	Object.keys(values).forEach(function(key){
		self[key] = values[key];
	});

	this.save();
};
Options.prototype = {
	save: function () {
		localStorage[this._storageKey] = JSON.stringify(this, function (key, value){
			if (key.indexOf('_') != 0) {
				return value;
			}
		});
	},
	reset: function () {
		localStorage.removeItem(this._storageKey);
	},
	getApp: function (appId) {
		var app = null;
		this.apps.forEach(function (e, i) {
			if (e.appId == appId) {
				app = e;
			}
		});
		if (app == null) {
			app = this._createApp(appId);
			this.apps.push(app);
		}
		return app;
	},
	_createApp: function (appId) {
		return 	{appId:appId,
				 star:false,
				 gqlHistory:[ /*{gql:'', namespace:'', star:false}*/ ],
				 schemaList:[ /*{kind:'',  prop:[{name:'age', type:'int'}] }*/ ]
				};
	}
};
Options.load = function (storageKey) {
	storageKey = storageKey || 'options';
	if (localStorage.hasOwnProperty(storageKey)) {
		return new Options(JSON.parse(localStorage[storageKey]), storageKey);
	}
	return new Options(null, storageKey);
}
