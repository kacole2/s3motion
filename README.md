s3motion
======================
s3motion is a command line utility used to upload/download local files and transfer objects between S3 compatible storage.

** DO NOT USE THIS TOOL YET. STILL WIP **

## Description
s3motion creates a simple user interface for migrating, copying, uploading, and downloading of files to S3 compatible storage. The uses cases can be: 
- a command line tool to upload/download files
- a move/copy individual files at scheduled intervals between buckets
- migrate between services. copy entire bucket, then change your application to point to new service

## Installation
To install it as a command line utility locally: `npm install s3motion -g`

** NOT AVAILABLE YET **
** The REST implementation will allow you to run it as a microservice in a docker container that can be called from any application. `docker run emccode/s3motion` **

## CLI Usage
All commands are accessible via the `-h` or `--help` flag. Only one flag can be used during a single command. There are two modes to run the CLI utility. You can choose to pass all arguments through a single command, or run the wizard. To run the wizard simply type `wiz` or `wizard` after your chosen flag (ie `s3motion -n wizard`).

- `-n` or `--newClient`: Add a new client to a locally stored s3motionClients.json file. The clients are used as a way to store credential information locally and pipe those in for operational use. The s3motionClients.json will be stores in the current users working home directory. Here are the following arguments that can be passed for a single line command:
	- `--name`: This is an arbitrary name you are using to identify your client. This name must be unique and cannot be the same as one previously used. If you want to use a previously configured name, edit the s3motionClients.json file. This is a required argument.
	- `--accessKeyId`: This is the S3 Access Key/ID. This is a required argument.
	- `--secretAccessKey`: This is the S3 Secret Access Key. This is a required argument.
	- `--endpoint`: Only specify this if you are trying to access third-party S3 compatible storage. If you are adding a new client for AWS, leave this blank. The endpoint assumes `https` and port `443`, therefore, a DNS or IP address will work such as `vipr.emc.com`. If your storage uses unsecured access, then you must specify the protocol and port such as `http://vipr.emc.com:80`. If you're endpoint uses a different port that can be specified as `vipr.emc.com:10101` which assumes `https`.
- `-L` or `--listClients`: List all the clients available in the s3motionClients.json file. No arguments needed for this command.
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
	- `--file`: Specify the name of the file. If the file is nested within a folder, specify the directory listing as well: `images/myimages/avatar.png`. You can also specify multiple files to download by using a comma and no spaces such as `file1.png,file2.png,images/myimages/avatar.png`. This is a required argument.
	- `--folder`: Specify the location on your local machine where the file(s) will be download to. `/Users/me/Desktop`. If no folder is specified, then the file is downloaded to the current working directory. This is an optional argument.
- `-u` or `--uploadObject`: Upload an object(s) to a bucket. Here are the following arguments that can be passed for a single line command:
	- `--client`: Specify the name of the locally configued client. This is a required argument.
	- `--bucket`: Specify the name of the bucket. This is a required argument.
	- `--file`: Specify the name of the file. By default, uploaded files will be placed in the root directory. This is a required argument.
	- `--folder`: Specify the location on your local machine where the file(s) will be uploaded from. `/Users/me/Desktop`. If no folder is specified, then the file is downloaded to the current working directory. This is an optional argument.
- `-D` or `--deleteObject`: Delete an object(s) from a bucket. Here are the following arguments that can be passed for a single line command:
	- `--client`: Specify the name of the locally configued client. This is a required argument.
	- `--bucket`: Specify the name of the bucket. This is a required argument.
	- `--file`: Specify the name of the file. If the file is nested within a folder, specify the directory listing as well: `images/myimages/avatar.png`. You can also specify multiple files to delete by using a comma and no spaces such as `file1.png,file2.png,images/myimages/avatar.png`. This is a required argument.
- `-c` or `--copyObject`: Copy an object(s) from one client to another. Here are the following arguments that can be passed for a single line command:
	- `--sourceClient`: Specify the name of the locally configued client where the object is stored. This is a required argument.
	- `--sourceBucket`: Specify the name of the bucket where the object is stored. This is a required argument.
	- `--file`: Specify the name of the file. If the file is nested within a folder, specify the directory listing as well: `images/myimages/avatar.png`. You can also specify multiple files to copy by using a comma and no spaces such as `file1.png,file2.png,images/myimages/avatar.png`. This is a required argument.
	- `--destClient`: Specify the name of the locally configued client where the object will be copied to. This is a required argument.
	- `--destBucket`: Specify the name of the bucket where the object will be copied to. This is a required argument.
	- `--delete`: Default is `n` which means the source copy will remain in the bucket. Specify `Y` if the source file should be deleted upon a successful transfer.
- `-C` or `--copyBucket`: Bulk copy process for all object from one bucket to another. Here are the following arguments that can be passed for a single line command:
	- `--sourceClient`: Specify the name of the locally configued client where the object is stored. This is a required argument.
	- `--sourceBucket`: Specify the name of the bucket where the object is stored. This is a required argument.
	- `--destClient`: Specify the name of the locally configued client where the object will be copied to. This is a required argument.
	- `--destBucket`: Specify the name of the bucket where the object will be copied to. This is a required argument.

- **TBD** `s3motion -p` or `s3motion --port`: Start a webservice listening on specific port for REST based commands.

## REST Usage
Still need to build using express.js

## Future
- Fix Multiple Copy Problem.
- Microservice using Express.js
- Web front end

## Contribution
- Fork it, merge it

Licensing
---------
Licensed under the Apache License, Version 2.0 (the “License”); you may not use this file except in compliance with the License. You may obtain a copy of the License at <http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an “AS IS” BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Support
-------
Please file bugs and issues at the Github issues page. For more general discussions you can contact the EMC Code team at <a href="https://groups.google.com/forum/#!forum/emccode-users">Google Groups</a> or tagged with **EMC** on <a href="https://stackoverflow.com">Stackoverflow.com</a>. The code and documentation are released with no warranties or SLAs and are intended to be supported through a community driven process.