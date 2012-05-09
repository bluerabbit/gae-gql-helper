var TD_STYLE = "padding: 3px 8px; border-left: 1px solid #D9D9D9; border-top: 1px solid #FFF; border-bottom: 1px solid #FFF; cursor: pointer;";
var TD_EVEN_STYLE = TD_STYLE + "background: #edf3fe; BORDER-BOTTOM: 1px solid #E8F0FF; BORDER-TOP: 1px solid #E8F0FF; BORDER-RIGHT: 1px solid #FFF; ";
var TD_ODD_STYLE = TD_STYLE + "background: #FFF; BORDER-BOTTOM: 1px solid #FFF; BORDER-TOP: 1px solid #FFF; BORDER-RIGHT: 1px solid #FFF; ";
//var TD_THIS_STYLE = TD_STYLE + "background-color: #3d80df; color: #FFF; font-weight: bold; border-left: 1px solid #346DBE; border-bottom: 1px solid #3E6FB3; border-top: 1px solid #3E6FB3; BORDER-RIGHT: 1px solid #5886C7; ";
//var TD_HOVER_STYLE = TD_STYLE + "background-color: #777; color: #FFF; border-left: 1px solid #888; border-bottom: 1px solid #888; border-top: 1px solid #888; BORDER-RIGHT: 1px solid #777; ";
var appId = $('#ae-appbar-app-id').val();

function getApp(appId, fn) {
    chrome.extension.sendRequest({id:'getApp', appId:appId}, function(app){
        fn(app);
    });
}

function createInputBox() {
	var table = $("#ae-datastore-explorer-entities");
	if (table.length == 0) {
		return ;
	}

	var kind = $("#ae-datastore-explorer-kind").val();
	var tr = table.find("thead tr").clone();
	var createGql = function () {
	    $("#ae-datastore-explorer-gql-checkbox").attr('checked', true);
		var gql = ["SELECT * FROM " + kind, " where "];
		tr.find("th input").each(function (i, e) {
			var input = $(e);
			if (input.val().length > 0) {
				var type = input.attr('placeholder');
				if (i == 0 && type == 'key') {
					gql.push('__key__');
					gql.push(" = ");
					if (input.val().indexOf('id=') == 0) {
						gql.push("KEY('" + kind +  "', "+ input.val().substring('id='.length) + ")");
					} else {
						gql.push("KEY('" + kind +  "', '"+ input.val().substring('name='.length) + "')");
					}
				} else {
					gql.push(input.attr('name'));
					gql.push(" = ");
					// bool, float, intは''をつけない
					if (type == 'bool' || type == 'int' || type == 'float') {
						gql.push(input.val());
                    } else if(input.val() == '<null>') {
                        gql.push('null');
                    } else {
						gql.push("'" + input.val() + "'");
					}
				}
				gql.push(" AND ");
			}
		});
		gql.pop();
		$("#ae-datastore-explorer-gql").val(gql.join(""));
	};

	getApp(appId, function (app) {
		var properties = {'ID/Name':'key'};
		app.schemaList.forEach(function (e) {
			if (e.kind == kind) {
				e.properties.forEach(function (prop) {
					properties[prop.name] = prop.type;
				});
			}
		});
		tr.find("th").each(function (i, e) {
		   var th = $('<th/>');
		   if (i == 0) {
		     $(e).replaceWith(th);  // checkbox
		   } else {
			 var propName = $.trim($(e).text());
		     var txt = $('<input  />').attr({type:'text', name:propName, id:'txt_' + i});
		     txt.attr('placeholder', properties[propName] == null ? '' :  properties[propName]);
		     txt.change(createGql);
		     // テキストボックスでエンターキーを押下すると検索するようにする
		 	 var dummyForm = $('<form>').submit(function () {
				txt.change();
				$('#ae-datastore-explorer-button').click();
				return false;
			 });
		     dummyForm.append(txt);
		     th.append(dummyForm);
		     $(e).replaceWith(th);
		   }
		});
		table.find("thead").append(tr);

		$('#ae-datastore-explorer-entities tbody tr').each(function (i, tr) {
			$(tr).find('td').each(function (tdIndex, td) {
                if (tdIndex == 0) {
                    return; // checkbox
                }
                if ($(this).text().trim() == '<missing>') {
                    return;
                }
				$(td).css('cursor', 'pointer').click(function () {
				    var txt = $('#txt_' + tdIndex);
                    txt.val($(this).text().trim());
                    txt.change();
				});
			});
		});
	});
}


function gqlHistory() {
	// 履歴を作成する
	$("#ae-datastore-explorer-button").click(function (e){
		var namespace = $("#ae-datastore-explorer-namespace-query-select").val();
		var gql = $("#ae-datastore-explorer-gql").val();
		var gqlObject = {appId:appId, namespace:namespace, gql:gql, star:false};
		chrome.extension.sendRequest({id:'addGql', appId:appId, gql:gqlObject});
	});

    $.get(chrome.extension.getURL('/handlebars-template/gql_history_table.html')).done(function (template) {
        // 履歴を表示する
        getApp(appId, function (app) {
            var createTable = function (star) {
                $('#handlebars-template').remove();
                Handlebars.registerHelper('star_src', function (isStar) {
                    return chrome.extension.getURL(isStar ? '/images/star_on.png' : '/images/star_off.png');
                });

                Handlebars.registerHelper('td_style', function (index) {
                    return index%2 == 0 ? TD_ODD_STYLE : TD_EVEN_STYLE;
                });

                Handlebars.registerHelper('each'/* override */, function(org_context, options) {
                    var ret = "";
                    var context = jQuery.extend(true, [], org_context); // Deep copy
                    for(var i=0, j=context.length; i<j; i++) {
                        context[i].each_index = i; // each_with_index
                        ret = ret + options.fn(context[i]);
                    }
                    return ret;
                });

                var converter = Handlebars.compile(template);
                var context = {app_star:star, gqlHistorys:star ? toStarList(app.gqlHistory) : app.gqlHistory};
                var html = converter(context);
                $("#ae-datastore-explorer-form-options").append(html);

                $("#gqlHistoryTable img").click(function (){
                    var img = $(this);
                    var src = img.attr('src');
                    var star = src.indexOf('on.png') > 0 ? true : false;
                    img.attr('src', star ? src.replace('on.png', 'off.png') : src.replace('off.png', 'on.png'));
                    if (app.star) {
                        var starList = $.map(app.gqlHistory, function (e, i) { if (e.star) {return e;} return null; });
                        starList[img.attr('index')].star = !star;
                    } else {
                        app.gqlHistory[img.attr('index')].star = !star;
                    }
                    chrome.extension.sendRequest({id:'gqlHistoryStarUpdate', appId:appId, gqlHistory:app.gqlHistory});
                });

                $('#all_star_toggle').click(function () {
                    var img = $(this);
                    var src = img.attr('src');
                    var star = src.indexOf('on.png') > 0 ? true : false;
                    img.attr('src', star ? src.replace('on.png', 'off.png') : src.replace('off.png', 'on.png'));
                    createTable(!star);
                    chrome.extension.sendRequest({id:'toggleStar', appId:appId});
                });

                $("#gqlHistoryTable .gql-history-text").click(function () {
                    $("#ae-datastore-explorer-gql").val($(this).text().trim());
                    $("#ae-datastore-explorer-namespace-query-select").val($(this).data('namespace')); // TODO:namespace対応
                });
            };

            createTable(app.star);
        });
    });
}
createInputBox();
gqlHistory();


function toStarList(list) {
	var starList = [];
	list.forEach(function (e, i) {
		if (e.star) {
			starList.push(e);
		}
	});
	return starList;
}