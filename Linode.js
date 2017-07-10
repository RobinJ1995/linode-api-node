let Promise = require ('bluebird');
let Request = require ('request-promise');
let DeepMerge = require ('deepmerge');

module.exports = class Linode
{
	constructor (apiKey, internal)
	{
		this.requestDelay = 0; // Increase this if you run into rate limiting issues //
		
		if (! internal)
			return new Proxy (new Linode (apiKey, true), handler);
		else
			this.apiKey = apiKey;
	}
	
	request (type, endpoint, data, page)
	{
		if (page === undefined)
			page = 1;
		
		let uri = 'https://api.linode.com/v4/' + endpoint + '?page=' + page;
		//if (type === 'GET')
		//	uri += '?' + Object.keys (data).map ((v) => v + '=' + data[v]).join ('&');
			
		let options = {
			uri: uri,
			body: data,
			headers: {
				'Authorization': 'token ' + this.apiKey
			},
			json: true,
			method: type
		};
		
		return Promise.delay (this.requestDelay).then (() => {
			return Request (options);
		});
	}
}

let handler = {
	get: function (target, name)
	{
		return function (...params)
		{
			let method, resource, endpoint;
			let data = {};
			let methodMap = {
				'create': 'POST',
				'set': 'POST',
				'edit': 'PUT',
				'get': 'GET',
				'list': 'GET',
				'remove': 'DELETE'
			};
			let paramI1Resources = ['domains', 'nodebalancers', 'regions'];
			
			for (let prefix in methodMap)
			{
				if (name.toLowerCase ().startsWith (prefix))
				{
					method = methodMap[prefix];
					resource = name.substr (prefix.length);
				}
			}
			
			if (! method)
				throw new Error ('Invalid method');
			
			let ucIndexes = upperCaseIndexes (resource);
			let endpointParts = [];
			let start = 0;
			let end = resource.length;
			for (let i = start + 1; i < ucIndexes.length + 1; i++)
			{
				let index = i == ucIndexes.length - ucIndexes[i] ? end : ucIndexes[i];
				endpointParts.push (pluralify (resource.toLowerCase ().substring (start, index)));
				start = index;
			}
			
			if (typeof params[params.length - 1] == 'object')
				data = params.pop ();
			
			let paramFirstIndex = paramI1Resources.includes (endpointParts[0]) ? 1 : 2;
			let paramIndexes = [];
			for (let i = 0; i < params.length; i++)
				paramIndexes.push (paramFirstIndex + i * 2);
			let endpointPartCount = endpointParts.length;
			while (paramIndexes.length > 0)
				endpointParts.splice (paramIndexes.shift (), 0, params.shift ());
			
			return target.request (method, endpointParts.join ('/'), data)
				.then ((response) => {
					if (response && response.page && response.total_pages && response.page < response.total_pages)
					{
						let promises = [ Promise.resolve (response) ];
						
						for (let i = response.page + 1; i <= response.total_pages; i++)
							promises.push (target.request (method, endpointParts.join ('/'), data, i));
						
						return Promise.all (promises)
							.then ((responses) => {
								return DeepMerge.all (responses, { arrayMerge: (arr1, arr2) => { return arr1.concat (arr2); }});
							});
					}
					
					return response;
				});
		}
	}
}

function upperCaseIndexes (str)
{
	let indexes = [];
	
	for (let i = 0; i < str.length; i++)
	{
		if (str.charAt (i) !== str.charAt (i).toLowerCase ())
			indexes.push (i);
	}
	
	return indexes;
}

function pluralify (str)
{
	let map = {
		'distribution': 'distributions',
		'kernel': 'kernels',
		'instance': 'instances',
		'disk': 'disks',
		'backup': 'backups',
		'ip': 'ips',
		'stackscript': 'stackscripts',
		'type': 'types',
		'domain': 'domains',
		'record': 'records',
		'nodebalancer': 'nodebalancers',
		'balancer': 'nodebalancers',
		'config': 'configs',
		'node': 'nodes',
		'network': 'networks',
		'ipassign': 'ip-assign',
		'region': 'regions',
		'ticket': 'tickets',
		'reply': 'replies',
		'attachment': 'attachments',
		'tfaenable': 'tfa-enable',
		'tfaenableconfirm': 'tfa-enable-confirm',
		'tfadisable': 'tfa-disable',
		'grant': 'grants',
		'token': 'tokens',
		'setting': 'settings',
		'client': 'clients',
		'user': 'users',
		'event': 'events'
	};
	
	if (Object.keys (map).includes (str))
		return map[str];
	
	return str;
}
