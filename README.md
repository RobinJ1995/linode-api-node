# Linode API

Node.js Linode API based on their v4 API.

Methods are dynamic based on API endpoints specified in the documentation over here; https://developers.linode.com/api/v4

## Usage

Since methods calls on this API automatically generate the API URL to call you will need to have a look at Linode API v4's documentation.
Methods are always in the format `actionResource`. So to create a domain, you would call `createDomain (data)` with `data` being an object containing the fields and their values as per API documentation. To get a Linode instance (based on the `/linode/instances/:id` API route) you would call `getLinodeInstance (id)`.

URL parameters can be passed in in the order that they would appear in the route according to the documentation, and if there is a data object it can be passed along as the last parameter.

Every call returns a Promise with the result returned by their API.

### Actions

`create` or `set` for `POST` requests, `edit` for `PUT` requests, `get` or `list` for `GET` requests, `remove` for `DELETE` requests.

## Examples

### Create domain

API route: `/domains` (POST)

```
let lnc = new Linode ('api-key');
lnc.createDomain ({ domain: 'example.org', type: 'master', soa_email: 'info@example.org' })
	.then
	(
		(response) => {
			console.log ('Domain ID: ' + response.id);
		}
	);
```

### Get all distributions

API route: `/linode/distributions` (GET)

```
let lnc = new Linode ('api-key');
lnc.getLinodeDistributions ()
	.then (...);
```

### Get a Linode's disks

API route: `/linode/instances/:id/disks`

```
let lnc = new Linode ('api-key');
lnc.getLinodeInstanceDisks (linodeInstanceId)
	.then (...);
```
