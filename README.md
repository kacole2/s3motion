s3motion
======================
s3motion is a combination of both a command line utility and REST based microservice used to upload and download local objects and transfer objects between S3 compatible storage.

## Description
s3motion creates a simple CLI user interface or REST based microservice for migrating, copying, uploading, and downloading of objects to S3 compatible storage. The uses cases can be: 
- a command line tool to upload/download objects
- a move/copy individual objects at scheduled intervals between buckets
- migrate between services. copy entire bucket, then change your application to point to new service

## Installation
Make sure node.js and npm is installed first, then install it globally by issuing: `npm install s3motion -g`

To run it as a microservice by utilizing the REST implementation, deploy it in a docker container that can be called from any application. `docker run -d -p 8080:8080 emccode/s3motion`. To interact with the container for CLI purposes, you can `docker run -ti --entrypoint=/bin/bash emccode/s3motion`

## CLI Usage
All commands are accessible via the `-h` or `--help` flag. Only one flag can be used during a single command. There are two modes to run the CLI utility. You can choose to pass all arguments through a single command, or run the wizard. To run the wizard simply type `wiz` or `wizard` after your chosen flag (ie `s3motion -n wizard`).

- `-n` or `--newClient`: Add a new client to a locally stored s3motionClients.json object. The clients are used as a way to store credential information locally and pipe those in for operational use. The s3motionClients.json will be stores in the current users working home directory. Here are the following arguments that can be passed for a single line command:
	- `--name`: This is an arbitrary name you are using to identify your client. This name must be unique and cannot be the same as one previously used. If you want to use a previously configured name, edit the s3motionClients.json object. This is a required argument.
	- `--accessKeyId`: This is the S3 Access Key/ID. This is a required argument.
	- `--secretAccessKey`: This is the S3 Secret Access Key. This is a required argument.
	- `--endpoint`: Only specify this if you are trying to access third-party S3 compatible storage. If you are adding a new client for AWS, leave this blank. The endpoint assumes `https` and port `443`, therefore, a DNS or IP address will work such as `vipr.emc.com`. If your storage uses unsecured access, then you must specify the protocol and port such as `http://vipr.emc.com:80`. If you're endpoint uses a different port that can be specified as `vipr.emc.com:10101` which assumes `https`.
- `-L` or `--listClients`: List all the clients available in the s3motionClients.json object. No arguments needed for this command.
- `-b` or `--listBuckets`: List all the avialable buckets for a specific client. Here are the following arguments that can be passed for a single line command:
	- `--client`: Specify the name of the locally configued client. This is a required argument.
- `-N` or `--newBucket`: Create a new bucket for a client. Here are the following arguments that can be passed for a single line command:
	- `--client`: Specify the name of the locally configued client. This is a required argument.
	- `--name`: Specify the name of the new bucket. This is a required argument.
- `-l` or `--listObjects`: List all the objects in a bucket. Here are the following arguments that can be passed for a single line command:
	- `--client`: Specify the name of the locally configued client. This is a required argument.
	- `--bucket`: Specify the name of the bucket. This is a required argument.
- `-d` or `--downloadObject`: Download an object(s) from a bucket. Here are the following arguments that can be passed for a single line command:
	- `--client`: Specify the name of the locally configued client. This is a required argument.
	- `--bucket`: Specify the name of the bucket. This is a required argument.
	- `--object`: Specify the name of the object. If the object is nested within a folder, specify the directory listing as well: `images/myimages/avatar.png`. You can also specify multiple objects to download by using a comma and no spaces such as `object1.png,object2.png,images/myimages/avatar.png`. This is a required argument.
	- `--folder`: Specify the location on your local machine where the object(s) will be download to. `/Users/me/Desktop`. If no folder is specified, then the object is downloaded to the current working directory. This is an optional argument.
- `-u` or `--uploadObject`: Upload an object(s) to a bucket. Here are the following arguments that can be passed for a single line command:
	- `--client`: Specify the name of the locally configued client. This is a required argument.
	- `--bucket`: Specify the name of the bucket. This is a required argument.
	- `--object`: Specify the name of the object. By default, uploaded objects will be placed in the root directory. This is a required argument.
	- `--folder`: Specify the location on your local machine where the object(s) will be uploaded from. `/Users/me/Desktop`. If no folder is specified, then the object is downloaded to the current working directory. This is an optional argument.
- `-D` or `--deleteObject`: Delete an object(s) from a bucket. Here are the following arguments that can be passed for a single line command:
	- `--client`: Specify the name of the locally configued client. This is a required argument.
	- `--bucket`: Specify the name of the bucket. This is a required argument.
	- `--object`: Specify the name of the object. If the object is nested within a folder, specify the directory listing as well: `images/myimages/avatar.png`. You can also specify multiple objects to delete by using a comma and no spaces such as `object1.png,object2.png,images/myimages/avatar.png`. This is a required argument.
- `-c` or `--copyObject`: Copy an object(s) from one client to another. Here are the following arguments that can be passed for a single line command:
	- `--sourceClient`: Specify the name of the locally configued client where the object is stored. This is a required argument.
	- `--sourceBucket`: Specify the name of the bucket where the object is stored. This is a required argument.
	- `--object`: Specify the name of the object. If the object is nested within a folder, specify the directory listing as well: `images/myimages/avatar.png`. You can also specify multiple objects to copy by using a comma and no spaces such as `object1.png,object2.png,images/myimages/avatar.png`. This is a required argument.
	- `--destClient`: Specify the name of the locally configued client where the object will be copied to. This is a required argument.
	- `--destBucket`: Specify the name of the bucket where the object will be copied to. This is a required argument.
	- `--delete`: Default is `n` which means the source copy will remain in the bucket. Specify `Y` if the source object should be deleted upon a successful transfer.
- `-C` or `--copyBucket`: Bulk copy process for all object from one bucket to another. Here are the following arguments that can be passed for a single line command:
	- `--sourceClient`: Specify the name of the locally configued client where the object is stored. This is a required argument.
	- `--sourceBucket`: Specify the name of the bucket where the object is stored. This is a required argument.
	- `--destClient`: Specify the name of the locally configued client where the object will be copied to. This is a required argument.
	- `--destBucket`: Specify the name of the bucket where the object will be copied to. This is a required argument.

- `s3motion -R` or `s3motion --REST`: Start a webservice listening on port 8080 for REST based commands.

## REST Usage
In addition to running this as a command line, it can also accept REST requests. To begin the microservice to accept REST commands use `s3motion -R`. You will see a message that says **s3motion microservice started on port 8080**. All requests must go through /api, for example `http://myserver.mycompany.com:8080/api`. All requests are returned with JSON. The default port used is always `:8080`.

The following REST commands are available to you.

- /api/clients
  - GET: Returns a JSON object with all clients configured in the s3motionClients.json object
  
			GET http://127.0.0.1:8080/api/clients
			Status: 200 OK
			JSON:
			{
			  clients: [3]
				0:  {
				  name: "vipronline"
				  accessKeyId: "*******"
				  secretAccessKey: "*********"
				  endpoint: "object.vipronline.com"
				}-
				1:  {
				  name: "aws"
				  accessKeyId: "*******"
				  secretAccessKey: "********"
				}-
				2:  {}
			}
  - POST: Creates a new client in the s3motionClients.json object. Payload requires `name`, `accessKeyId`, and `secretAccessKey` while `endpoint` is optional.
  
			POST http://127.0.0.1:8080/api/clients
			Status: 200 OK
			JSON:
			{
			  operation: "newClient"
			  client: "APItest"
			  accessKeyId: "gniowrngosejbrjs90u390289r342nv"
			  secretAccessKey: "fwefew7&^7@(*fec9#**vcuovcuyvwu"
			  status: "success"
			}

- /api/buckets/:client
  - GET: Returns a JSON object with all buckets for a client
  
			GET http://127.0.0.1:8080/api/buckets/vipronline
			Status: 200 OK
			JSON:
			{
			Buckets: [2]
			  0:  {
				Name: "s3jump"
				CreationDate: "2015-01-30T16:59:28.026Z"
			  }
			  1:  {
				Name: "s3motion_vipr01"
				CreationDate: "2015-01-15T18:37:41.182Z"
			  }
			Owner: {
				DisplayName: "user056"
				ID: "user056"
			}
			}
  - POST: Creates a new bucket for a client. Payload requires `name` for the bucket.
  
			POST http://127.0.0.1:8080/api/clients
			Status: 200 OK
			JSON:
			{
				Location: "/apitest"
			}

- /api/bucket/copy
  - POST: Copies one bucket to an another in its entirety. Payload requires `sourceClient`, `sourceBucket`, `destClient`, and `destBucket`. You will never get a "success" status message as a response because depending on the amount of objects that must be copied over could take a while and the browser will timeout.
  
			POST http://127.0.0.1:8080/api/bucket/copy
			Status: 200 OK
			JSON:
			{
				operation: "copyBucket"
				sourceClient: "aws"
				sourceBucket: "s3motion01"
				destClient: "vipronline"
				destBucket: "s3motion_vipr01"
				status: "running"
			}

- /api/objects/:client/:bucket
  - GET: Returns a JSON object with all objects in a bucket. Depending on the amount of objects, the browser may timeout. The timeout is currently set to 4 minutes for Express.js, but most browsers will timeout after 2 minutes. You will need a browser with a configurable timeout to wait for the objects to be collected. Anything greater than >100,000 objects will more than likely timeout after 2 minutes.
  
			GET http://127.0.0.1:8080/api/objects/vipronline/s3motion_vipr01
			Status: 200 OK
			JSON:
			[1]
			  0:  [4]
				0:  {
				  Key: "object1.ics"
				  LastModified: "2015-02-05T15:30:28.846Z"
				  ETag: ""699e612ef53db0c730ba2b809935509d""
				  Size: 3391
				  StorageClass: "STANDARD"
				  Owner: {
				    DisplayName: "user056"
				    ID: "user056"
				  }
				}
				1:  {
				  Key: "object2.xlsx"
				  LastModified: "2015-02-05T15:30:29.459Z"
				  ETag: ""fcb4a7c70c7c70df8484f0a44d34b22f""
				  Size: 26483
				  StorageClass: "STANDARD"
				  Owner: {
				    DisplayName: "user056"
				    ID: "user056"
				  }
				}
				2:  {
				  Key: "object3.xlsx"
				  LastModified: "2015-02-05T15:30:28.927Z"
				  ETag: ""ad6e381175f42a9b2b26f90a068a3823""
				  Size: 13428
				  StorageClass: "STANDARD"
				  Owner: {
				    DisplayName: "user056"
				    ID: "user056"
				  }
				}
				3:  {
				  Key: "object4.csv"
				  LastModified: "2015-02-05T15:30:28.918Z"
				  ETag: ""9a058b5b07578848b8d2406ded823d7e""
				  Size: 7792
				  StorageClass: "STANDARD"
				  Owner: {
				    DisplayName: "user056"
				    ID: "user056"
				  }
				}
  - POST: Uploads an object to a specific bucket and client. Payload requires `object`. `object` can be in the form of comma seperated values. `folder` is an optional parameter to specify where on the host object system the object is located. By default, uploads will go to the root of the bucket.
  
			POST http://127.0.0.1:8080/api/objects/vipronline/s3motion_vipr01
			Status: 200 OK
			JSON:
			{
			  operation: "objectUpload"
			  objects: "object1.png,object2.jpg"
			  folder: "/home/kcoleman"
			  client: "vipronline"
			  bucket: "s3motion_vipr01"
			  status: "complete"
			}
  - DELETE: Deletes an object(s) in a specific bucket and client. Payload requires `object`. `object` can be in the form of comma seperated values.
  
			DELETE http://127.0.0.1:8080/api/objects/vipronline/s3motion_vipr01
			Status: 200 OK
			JSON:
			{
			  operation: "objectDelete"
			  objects: "object1.jpg,object2.gif"
			  client: "vipronline"
			  bucket: "s3motion_vipr01"
			  status: "complete"
			}

- /api/object/copy
  - POST: Copies an object(s) from one bucket to another. Payload requires `sourceClient`, `sourceBucket`, `destClient`, `destBucket`, and `object`. `object` can be in the form of comma seperated values. You will never get a "success" status message as a response because depending on the amount of objects that must be copied over could take a while and the browser will timeout.
  
			POST http://127.0.0.1:8080/api/bucket/copy
			Status: 200 OK
			JSON:
			{
		      operation: "objectCopy"
			  objects: "object1.jpg,object2.gif"
			  sourceClient: "aws"
			  sourceBucket: "s3motion01"
			  destClient: "vipronline"
			  destBucket: "s3motion01_vipr01"
			  status: "running"
			}

- /api/object/download
  - POST: Downloads an object(s) from one bucket to the host running the microservice. Payload requires `client`, `bucket`, and `object`. `object` can be in the form of comma seperated values. `folder` is an optional value to specify the download location on the host.
  
			POST http://127.0.0.1:8080/api/bucket/copy
			Status: 200 OK
			JSON:
			{
		      operation: "downloadObject"
			  object: "object.json"
			  folder: "/home/user"
			  client: "vipronline"
			  bucket: "s3motion_vipr01"
			  status: "complete"
			}

## Troubleshooting
When using a 3rd party S3 storage service (not AWS) there are instances when the server returns a header without `content-length` and instead specifies `transfer-encoding: chunked`. 
```
{ date: 'Fri, 06 Feb 2015 20:18:09 GMT',
  server: 'ViPR/1.0',
  'x-amz-request-id': '0a6c5fc3:14af4ae3238:f7f1:b',
  'x-amz-id-2': '97e9f1ba70052a7b85e9db09cd13f09454828f6f0a5b92e5f691c07656a7ec10',
  etag: '"e1f0060d53cbfab7f917642abaa7a1c6"',
  'last-modified': 'Fri, 06 Feb 2015 16:09:15 GMT',
  'x-emc-mtime': '1423238955945',
  'content-type': 'application/zip',
  'transfer-encoding': 'chunked' }
```
This means the download process for a file will not happen because of how the [node-s3-client](https://github.com/andrewrk/node-s3-client) handles it. [Pull-request 76](https://github.com/andrewrk/node-s3-client/pull/76) will fix this behavior. 

## Future
- Add these functions depending on necessity
  - delete bucket including all objects (scary)
  - sync buckets between endpoints
  - upload object to a specific folder inside a bucket (just needs another param)
  - error messages for incorrect bucket spelling
  - bucket copy process don't specify destination Bucket, just copy the name of the source bucket.
  - bucket copy process needs to copy empty folders or create those entries on the destination bucket.
- Continue Microservice using Express.js
- Clean up the code
  - break out into multiple objects
- Web front end
- Create logging functionality

## Contribution
- Fork it, merge it

Licensing
---------
Licensed under the Apache License, Version 2.0 (the “License”); you may not use this file except in compliance with the License. You may obtain a copy of the License at <http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an “AS IS” BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Support
-------
Please file bugs and issues on the Github issues page for this project. This is to help keep track and document everything related to this repo. For general discussions and further support you can join the [EMC {code} Community slack channel](http://community.emccode.com/). Lastly, for questions asked on [Stackoverflow.com](https://stackoverflow.com) please tag them with **EMC**. The code and documentation are released with no warranties or SLAs and are intended to be supported through a community driven process.
