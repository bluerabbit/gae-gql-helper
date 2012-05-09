//<dl>
//	<dt>blobKey</dt>
//	<dd>
//		<input type="hidden" name="name-0" value="blobKey">
//		<em>value:</em>
//		<input id="value_string-0" type="text" name="value_string-0" size="32" value="">
//	</dd>
//	<dd class="ae-last">
//		<em>type:</em>
//		<select name="type-0">
//			<option value="null">null</option>
//			<option value="string" selected="">string</option>
//		</select>
//	</dd>
//</dl>
function schemaScan() {
	var schema = {kind:'', properties:[/*{name:'age', type:'int'}*/]};

	var frm = $('#ae-datastore-form');
	schema.kind = frm.find('input[name="kind"]').val();
	if (location.href.indexOf('https://appengine.google.com/datastore/edit') == 0) {
		schema.kind = $('#ae-content p a:last').text().trim().split(':')[0];
	}

	var dl = frm.find('dl');
	dl.find('dt').each(function (i, e) {
		schema.properties[i] = {name:$.trim($(e).text()), type:''};
	});

	dl.find('.ae-last option:selected').each(function (i, e) {
		var type = $.trim($(e).text());
		schema.properties[i]["type"] = (type == 'null' ? '' : type);
	});

	chrome.extension.sendRequest({id:'saveSchema', appId:$('#ae-appbar-app-id').val(), schema:schema});
}

schemaScan();