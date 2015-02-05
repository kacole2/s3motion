#! /usr/bin/env node

var AWS = require('aws-sdk'),
fs = require('fs'),
s3 = require('s3'),
async = require('async'),
ProgressBar = require('progress'),
chalk = require('chalk'),
program = require('commander'),
prompt = require('prompt'),
optimist = require('optimist'),
osenv = require('osenv');

//Functions
// @description Returns a client object for the AWS SDK
// @object awsClientArgs Paramters passed from outside functions. 
// @string accessKeyId Pipes in the access key for S3 access
// @string secretAccessKey Pipes in the secret key for S3 access
// @string endpoint Pipes in an endpoint for 3rd party S3 services
// @return client object for AWS SDK
var awsClient = function(awsClientArgs){
	var client = new AWS.S3({accessKeyId: awsClientArgs.accessKeyId, secretAccessKey: awsClientArgs.secretAccessKey, endpoint: awsClientArgs.endpoint});
	return client;
}

// @description Returns a client object for the S3 NPM package
// @object s3ClientArgs Paramters passed from outside functions. 
// @string accessKeyId Pipes in the access key for S3 access
// @string secretAccessKey Pipes in the secret key for S3 access
// @string endpoint Pipes in an endpoint for 3rd party S3 services
// @return client object for S3 NPM package
var s3Client = function(s3ClientArgs) {
	var s3object = new AWS.S3({accessKeyId: s3ClientArgs.accessKeyId, secretAccessKey: s3ClientArgs.secretAccessKey, endpoint: s3ClientArgs.endpoint});
	var options = {
		s3Client: s3object,
	}
	var client = s3.createClient(options); //creates new s3 client based on additional params from AWS SDK
	return client;
}

// @description Creates a new client json object
// @object newClientArgs Paramters passed from outside functions. 
var newClient = function(newClientArgs, done){
	var home = osenv.home(); //get the home directory for the current user
	// Two String functions needed to searching and inserting text to the json file
	String.prototype.insert = function (index, string) {
	  if (index > 0)
	    return this.substring(0, index) + string + this.substring(index, this.length);
	  else
	    return string + this;
	};
	String.prototype.includes = function() {'use strict';
    	return String.prototype.indexOf.apply(this, arguments) !== -1;
  	};

  	// Read the s3motionClients.json file to add a new client
  	fs.readFile(home + '/s3motionClients.json', function (err, data) { //buffer file into memory
	  	if (err) {
	  		// if s3motionClients.json does not exist, create it and then continue
	  		console.log("creating 's3motionClients.json' file in " + home);
	  		fs.writeFileSync(home + '/s3motionClients.json', '{"clients":[\n\t{\n\t}\n\t]\n}');
	  		var data = fs.readFileSync(home + '/s3motionClients.json');
	  	} 
	  		var content = data.toString('utf8'); //change buffer content to string for manipulation
		  	var contentJSON = JSON.parse(content); //parse the content to JSON
			var clients = contentJSON['clients']; //tab over to clients
			var clientExists = false; //set to false for error checking
			for (var i = 0; i < clients.length; i++) { //loop through all clients to see if the specified name exists
		    	if(clients[i]['name'] == newClientArgs.name) clientExists = true; //if it exists, set error handler to true
			}

			if(clientExists == true){ //if the error is true kill the process
				done(chalk.yellow.bold(newClientArgs.name) + chalk.red(" already exists. Please use a different name or edit the 's3motionClients.json' file"));
			} else {
				if(typeof newClientArgs.endpoint === 'undefined'){ //if endpoint is undefined (AWS), remove it from the insertion
					content = content.insert(13, '\t{ \n\t\t"name": "' + newClientArgs.name + '",\n\t\t"accessKeyId": "' + newClientArgs.accessKeyId + '",\n\t\t"secretAccessKey": "' + newClientArgs.secretAccessKey + '"\n\t},\n');
				} else {
					content = content.insert(13, '\t{ \n\t\t"name": "' + newClientArgs.name + '",\n\t\t"accessKeyId": "' + newClientArgs.accessKeyId + '",\n\t\t"secretAccessKey": "' + newClientArgs.secretAccessKey + '",\n\t\t"endpoint": "' + newClientArgs.endpoint + '"\n\t},\n');
				};
				fs.writeFile(home + '/s3motionClients.json', content, function (err) { //save the file with the new content
				  if (err) throw err;
				  done(chalk.yellow.bold(newClientArgs.name) + chalk.green.bold(" client created"));
				});
			}
	}); 
}

// @description Retrieve client from JSON file and return client
// @object getClientArgs Paramters passed from outside functions. 
var getClient = function(getClientArgs, done){
	var home = osenv.home(); //get current home directory
	fs.readFile(home + '/s3motionClients.json', function (err, data) { //read the file into buffer
		if (err) throw err; //error if file isn't found.
		var clientExists = false; //set error handler to FALSE
		var clients = JSON.parse(data); //put buffer data to JSON
		clients = clients['clients']; //tab into JSON
		for (var i = 0; i < clients.length; i++) {  //loop through all JSON objects and 
	    	if(clients[i]['name'] == getClientArgs.name) { //find the matching name supplied from the user input
	    		var clientExists = true; //set error handler to TRUE
	    			if(getClientArgs.client == 's3'){ //run function depending on type of client needed
	    				var s3clientReturn = s3Client({accessKeyId: clients[i]['accessKeyId'], secretAccessKey: clients[i]['secretAccessKey'], endpoint: clients[i]['endpoint']});
	    				done(s3clientReturn);
	    			} else if (getClientArgs.client == 'aws') {
	    				var awsClientReturn = awsClient({accessKeyId: clients[i]['accessKeyId'], secretAccessKey: clients[i]['secretAccessKey'], endpoint: clients[i]['endpoint']});
	    				done(awsClientReturn)	;
	    			}
	    	}
		}
		// if the supplied client isn't found, let the user know.
		if(clientExists == false) {
			done('');
		}
	});
} 

// @description List all clients
// @return JSON object
var listClients = function(done){
	var home = osenv.home();
	fs.readFile(home + '/s3motionClients.json', function (err, data) { //read the file into buffer
		var clients = JSON.parse(data);
		done(clients);
	});
}

// @description List all buckets for a client
// @object clientArgs Paramters passed from outside functions. 
// @return JSON object
var listBuckets = function(clientArgs, done){
	clientArgs.site.listBuckets(function(err, data) {
	  if (err) {
	    done(chalk.red('Could not retrieve buckets. Error: ' + err)); // error is Response.error
	  } else {
	    done(data); // data is Response.data
	  }
	});	
}

// @description Create new bucket for a client
// @object newBucketParams Paramters passed from outside functions. 
// @return JSON object
var newBucket = function(newBucketParams, done){
	var params = {
	  Bucket: newBucketParams.bucket //new bucket name is passed as a parameter
	};
	newBucketParams.site.createBucket(params, function(err, data) {
	  if (err) done(chalk.red(err, err.stack)); // an error occurred
	  else {
	  	done(data);
	  }    
	});
}

// @description List objects in a bucket for a client
// @object listArgs Paramters passed from outside functions. 
// @return JSON object
var listObjects = function(listArgs, done) {
	var objectLists = [];
	var objectCount = 0;
	var params = {
		s3Params: {
	  		Bucket: listArgs.bucket, //bucket name is passed as a parameter
		},
	};
	var lister = listArgs.site.listObjects(params); //specify site, passed as a listArgs param, to list bucket items
	lister.on('error', function(err) {
		done("unable to list " + listArgs.bucket + " : " + err.stack);
		//console.error(chalk.red("unable to list: " + chalk.red.bold(listArgs.bucket) + ""), chalk.yellow(err.stack));
	});
	lister.on('data', function(data) { //keep streaming data as its discovered
		var objects = data['Contents'];
		objectCount += data['Contents'].length;
		objectLists.push(objects);
		console.log(chalk.blue('Gathering list of objects from ' + listArgs.bucket + '...  Discovered ' + objectCount + ' objects so far'));
	});
	lister.on('end', function(data) {
		done(objectLists);
	});
}

// @description Download an object or set of objects from a bucket for a client
// @object downloadArgs Paramters passed from outside functions. 
// @return 
var downloadObject = function(downloadArgs, done) {
	var folder; //set the folder variable and run if/else if folder is not passed as a param to set a default.
	if(typeof downloadArgs.folder === 'undefined'){
		folder = ''
	} else {
		var lastChar = downloadArgs.folder.substr(downloadArgs.folder.length - 1);
		if (lastChar == '/') {
			folder = downloadArgs.folder
		} else {
			folder = downloadArgs.folder + '/'
		}
	};

	var downloadObjectProcess = function(downloadArgs, done){
		var params = {
			localFile: downloadArgs.folder + downloadArgs.file, //specify download location and the filename. no otf changes

			s3Params: {
		    	Bucket: downloadArgs.bucket, //specify bucket to download from
		    	Key: downloadArgs.file, //specify name of file/object to download
			},
		};
		var downloader = downloadArgs.site.downloadFile(params);
		downloader.on('error', function(err) {
			done(chalk.red("Unable to download " + chalk.red.bold(downloadArgs.file) + ". Check bucket name and object name :"), chalk.yellow(err.stack));
		});
		downloader.on('progress', function() {
			//if statement to run if this is called from a user function and not a predefined one
			done([downloadArgs.folder + downloadArgs.file, downloader.progressAmount, downloader.progressTotal]);
			if(typeof downloadArgs.transfer === undefined){
				//console.log(downloadArgs.file + chalk.green(" Progress:"), chalk.cyan(downloader.progressAmount, downloader.progressTotal));
			};
		});
		downloader.on('end', function() {
			done(downloadArgs.file + chalk.green.bold(" downloaded"));
			//done();
		});
		
	}
	//if files are passed in as an array, only do 10 at a time until completed
	if (downloadArgs.file instanceof Array){
		async.eachLimit(downloadArgs.file, 10, function(file, callback){
    		downloadObjectProcess({site: downloadArgs.site, bucket: downloadArgs.bucket, file: file, folder: folder}, function(data){
    			done(data);
    			callback();
    		});
		});
	} else {
		downloadObjectProcess({site: downloadArgs.site, bucket: downloadArgs.bucket, file: downloadArgs.file, folder: folder}, function(data){
			done(data);
		});
	}
	

}

// @description Upload an object or set of objects from a local location for a client
// @object uploadArgs Paramters passed from outside functions. 
// @return 
var uploadObject = function(uploadArgs, done) {
	var folder; //set the folder variable and run if/else if folder is not passed as a param to set a default.
	if(typeof uploadArgs.folder === 'undefined'){
		folder = ''
	} else {
		var lastChar = uploadArgs.folder.substr(uploadArgs.folder.length - 1);
		if (lastChar == '/') {
			folder = uploadArgs.folder
		} else {
			folder = uploadArgs.folder + '/'
		}
	};
	var uploadObjectProcess = function(uploadArgs, done){
		var params = {
		  localFile: uploadArgs.folder + uploadArgs.file, //specifying upload location

		  s3Params: {
		    Bucket: uploadArgs.bucket, //specify bucket name to upload to
		    Key: uploadArgs.file, //specify what the file will be called, using same file names. no changes
		  },
		};
		var uploader = uploadArgs.site.uploadFile(params);
		var i = 0;
		var l = 0;
		uploader.on('error', function(err) {
		  	done(chalk.red("unable to upload " + chalk.red.bold(uploadArgs.file) + ":"), chalk.yellow(err.stack));
		});
		uploader.on('progress', function() {
			//console.log('Progress: ' + uploader.progressMd5Amount, uploader.progressAmount, uploader.progressTotal);
			//if statement to run if this is called from a user function and not a predefined one
			if (i != 0){
				if(l == 0){
					done([uploadArgs.folder + uploadArgs.file, uploader.progressAmount, uploader.progressTotal]);
						if(uploader.progressAmount == uploader.progressTotal){
							l += 1;
						}
				}
			}
			i += 1;
			//if(typeof uploadArgs.transfer === undefined){
			//	console.log(chalk.green(uploadArgs.file + " progress"), chalk.cyan(uploader.progressMd5Amount, uploader.progressAmount, uploader.progressTotal));
			//};
		});
		uploader.on('end', function() {
			//if statement to run if this is called from a user function and not a predefined one
			done(chalk.green.bold(uploadArgs.file + " uploaded"));
			//done();
		});
	}
	//if files are passed in as an array, only do 10 at a time until completed
	if (uploadArgs.file instanceof Array){
		async.eachLimit(uploadArgs.file, 10, function(file, callback){
    		uploadObjectProcess({site: uploadArgs.site, bucket: uploadArgs.bucket, file: file, folder: folder}, function(data){
    			done(data);
    			callback();
    		});
		});
	} else {
		uploadObjectProcess({site: uploadArgs.site, bucket: uploadArgs.bucket, file: uploadArgs.file, folder: folder}, function(data){
			done(data);
		});
	}
}

// @description Copy an object or set of objects from an S3 bucket to another bucket and between clients
// @object copyArgs Paramters passed from outside functions. 
// @return 
var copyObject = function(copyArgs, done) {
	var copyProcess = function(copyProcessArgs, done) {
		//create a progress bar to show the copy process
		var bar = new ProgressBar('copy: ' + copyProcessArgs.file + ' [:bar :title] ', {
		    complete: chalk.green('='),
		    incomplete: ' ',
		    width: 30,
		    total: 3
		});
		//process goes to download file, upload file, remove from local filesystem. must be sequential.
		async.series([
			function(done) {				
				bar.tick({ title: chalk.blue('downloading') });
				downloadObject({site: copyProcessArgs.sourceSite, bucket: copyProcessArgs.sourceBucket, file: copyProcessArgs.file, folder: __dirname + '/s3motionTransfer/', transfer: true}, function(data){
					if(data == copyProcessArgs.file + chalk.green.bold(" downloaded")) {
						done();
					}
				});
			},
			function(done) {
				bar.tick({ title: chalk.blue('uploading') });
				uploadObject({site: copyProcessArgs.destinationSite, bucket: copyProcessArgs.destinationBucket, file: copyProcessArgs.file, folder: __dirname + '/s3motionTransfer/', transfer: true}, function(data){
					if(data == chalk.green.bold(copyProcessArgs.file + " uploaded")) {
						done();
					}
				});
			},
			function(done) {
				fs.unlink(__dirname + '/s3motionTransfer/' + copyProcessArgs.file, function (err) {
					if (err) throw err;
					bar.tick({ title: chalk.cyan('complete') });
					done();
				});
			}
		], 
		function(err, results){
			if (err) {
				done(chalk.red.bold('error occured: ') + chalk.yellow(err));
			} 
			done(copyProcessArgs.file + chalk.green('successfully copied'));
		});
	}

	if (copyArgs.file instanceof Array){
		async.eachLimit(copyArgs.file, 10, function(file, callback){
    		copyProcess({sourceSite: copyArgs.sourceSite, sourceBucket: copyArgs.sourceBucket, file: file, destinationSite: copyArgs.destinationSite, destinationBucket: copyArgs.destinationBucket}, function(data){
    			done();
    			callback();
    		});
		});
	} else {
		copyProcess({sourceSite: copyArgs.sourceSite, sourceBucket: copyArgs.sourceBucket, file: copyArgs.file, destinationSite: copyArgs.destinationSite, destinationBucket: copyArgs.destinationBucket}, function(data){
			done();
		});
	}
}

var deleteObject = function(deleteArgs, done){
	var filesToDelete = [];

	if (deleteArgs.file instanceof Array){
		length = deleteArgs.file.length;
		for (var i = 0; i < length; i++) {
			var obj = {Key: deleteArgs.file[i],};
			filesToDelete.push(obj);
		}
	} else {
		var obj = {Key: deleteArgs.file,};
		filesToDelete.push(obj);
	}

	var s3params = {
	    Bucket: deleteArgs.bucket,
	    Delete: {
	    	Objects: 
	    		filesToDelete,
		},		
	};
	
	var deleter = deleteArgs.site.deleteObjects(s3params);
	deleter.on('error', function(err) {
	  	done(chalk.red.bold("unable to delete:"), chalk.yellow(err.stack));
	});
	deleter.on('progress', function() {
		done([deleter.progressAmount, deleter.progressTotal]);
	});
	deleter.on('end', function() {
		done(deleteArgs.file + chalk.red(" deleted"));
	});
}

var moveObject = function(moveArgs, done) {
	var moveProcess = function(moveProcessArgs, done) {
		var bar = new ProgressBar('move: ' + moveProcessArgs.file + ' [:bar :title] ', {
		    complete: chalk.green('='),
		    incomplete: ' ',
		    width: 30,
		    total: 5
		});

		async.series([
			function(done) {
				bar.tick({ title: chalk.blue('downloading') });
				downloadObject({site: moveProcessArgs.sourceSite, bucket: moveProcessArgs.sourceBucket, file: moveProcessArgs.file, folder: __dirname + 's3motionTransfer/', transfer: true}, function(data){
					if(data == moveProcessArgs.file + chalk.green.bold(" downloaded")) {
						done();
					}
				});
			},
			function(done) {
				bar.tick({ title: chalk.blue('uploading') });
				uploadObject({site: moveProcessArgs.destinationSite, bucket: moveProcessArgs.destinationBucket, file: moveProcessArgs.file, folder: __dirname + 's3motionTransfer/', transfer: true}, function(data){
					if(data == chalk.green.bold(moveProcessArgs.file + " uploaded")) {
						done();
					}
				});
			},
			function(done) {
				bar.tick({ title: chalk.blue('deleting locally') });
				fs.unlink(__dirname + 's3motionTransfer/' + moveProcessArgs.file, function (err) {
				  if (err) throw err;
				  done();
				});
			},
			function(done) {
				bar.tick({ title: chalk.blue('deleting from source' ) });
				deleteObject({site: moveProcessArgs.sourceSite, bucket: moveProcessArgs.sourceBucket, file: moveProcessArgs.file, transfer: true}, function(data){
					done();
				});
			},
			function(done) {
				bar.tick({ title: chalk.cyan('complete') });
				done();
			}
		], 
		function(err, results){
			if (err) {
				done(chalk.red.bold('error occured while moving ' + moveProcessArgs.file + ': ') + chalk.yellow(err));
			}
			done(moveProcessArgs.file + chalk.green('successfully moved'));
		});
	}

	if (moveArgs.file instanceof Array){
		async.eachLimit(moveArgs.file, 10, function(file, callback){
    		moveProcess({sourceSite: moveArgs.sourceSite, sourceBucket: moveArgs.sourceBucket, file: file, destinationSite: moveArgs.destinationSite, destinationBucket: moveArgs.destinationBucket}, function(data){
    			done();
    			callback();
    		});
		});
	} else {
		moveProcess({sourceSite: moveArgs.sourceSite, sourceBucket: moveArgs.sourceBucket, file: moveArgs.file, destinationSite: moveArgs.destinationSite, destinationBucket: moveArgs.destinationBucket}, function(data){
			done();
		});
	}
}

var copyBucket = function(copyArgs, done) {
	var objectLists = [];
	var objectCount = 0;
	var params = {
		s3Params: {
			Bucket: copyArgs.sourceBucket,
		},
	};

	var lister = copyArgs.sourceSite.listObjects(params);
	lister.on('error', function(err) {
	  	console.error(chalk.red.bold("unable to list:"), chalk.yellow(err.stack));
	});
	lister.on('data', function(data) {
		var objects = data['Contents'];
		objectCount += data['Contents'].length;
		objectLists.push(objects);
		console.log(chalk.blue('Gathering list of objects... Discovered ' + objectCount + ' objects so far'));
	});
	lister.on('end', function(data) {
		console.log(chalk.blue(objectCount + ' objects found. Beginning transfer:'));

		async.eachSeries(objectLists,
			function(objectList, callback){		
			  	var copyProcess = function(copyProcessArgs, done) {
			  		var bar = new ProgressBar('copy: ' + copyProcessArgs.file + ' [:bar :title] ', {
					    complete: chalk.green('='),
					    incomplete: ' ',
					    width: 30,
					    total: 3
					});
			  		async.series([
						function(done) {				
							bar.tick({ title: chalk.blue('downloading') });
							downloadObject({site: copyProcessArgs.sourceSite, bucket: copyProcessArgs.sourceBucket, file: copyProcessArgs.file, folder: __dirname + '/s3motionTransfer/', transfer: true}, function(data){
								if(data == copyProcessArgs.file + chalk.green.bold(" downloaded")) {
									done();
								}
							});
						},
						function(done) {
							bar.tick({ title: chalk.blue('uploading') });
							uploadObject({site: copyProcessArgs.destinationSite, bucket: copyProcessArgs.destinationBucket, file: copyProcessArgs.file, folder: __dirname + '/s3motionTransfer/', transfer: true}, function(data){
								if(data == chalk.green.bold(copyProcessArgs.file + " uploaded")) {
									done();
								}
							});
						},
						function(done) {
							fs.unlink(__dirname + '/s3motionTransfer/' + copyProcessArgs.file, function (err) {
								if (err) throw err;
								bar.tick({ title: chalk.cyan('complete') });
								done();
							});
						}
					], 
					function(err, results){
						if (err) {
							done(chalk.red.bold('error occured with ' + copyProcessArgs.file + ': ') + chalk.yellow(err));
						} 
						done(copyProcessArgs.file + chalk.green('successfully copied'));
					});
				}
			async.eachLimit(objectList, 10, 
				function(object, callback){
		    		copyProcess({sourceSite: copyArgs.sourceSite, sourceBucket: copyArgs.sourceBucket, file: object['Key'], destinationSite: copyArgs.destinationSite, destinationBucket: copyArgs.destinationBucket}, function(data){
		    			done();
		    			callback();
		    		});
				}, function(err){

				}
			);
			callback();
			done();
		}, function(err){

		});
	});
}

var microservice = function() {
	// BASE SETUP
	// =============================================================================

	// call the packages we need
	var express    = require('express');        // call express
	var app        = express();                 // define our app using express
	var timeout    = require('connect-timeout');//set the timeout because waiting for object lists takes a while!
	var bodyParser = require('body-parser');

	// configure app to use bodyParser()
	// this will let us get the data from a POST
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

	app.use(timeout(300000));
	app.use(haltOnTimedout);

	function haltOnTimedout(req, res, next){
	  if (!req.timedout) next();
	}

	var port = process.env.PORT || 8080;        // set our port

	// ROUTES FOR OUR API
	// =============================================================================
	var router = express.Router();              // get an instance of the express Router

	// middleware to use for all requests
	router.use(function(req, res, next) {
	    // do logging
	    // console.log('Something is happening.');
	    next(); // make sure we go to the next routes and don't stop here
	});

	// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
	router.get('/', function(req, res) {
	    res.json({ message: 'hooray! welcome to our api!' });   
	});

	// more routes for our API will happen here
	// on routes that end in /bears
	// ----------------------------------------------------
	router.route('/clients')
		.post(function(req, res) { 
	        newClient({name: req.body.name, accessKeyId: req.body.accessKeyId, secretAccessKey: req.body.secretAccessKey, endpoint: req.body.endpoint}, function(data){
				console.log(data);
				if (data == chalk.yellow.bold(req.body.name) + chalk.green.bold(" client created")){
					res.json({  
						operation: 'newClient',
						client: req.body.name,
						accessKeyId: req.body.accessKeyId,
						secretAccessKey: req.body.secretAccessKey,
						endpoint: req.body.endpoint,
						status: 'success',
					});
				} else if (data == chalk.yellow.bold(req.body.name) + chalk.red(" already exists. Please use a different name or edit the 's3motionClients.json' file")){
					res.json({  
						operation: 'newClient',
						client: req.body.name,
						accessKeyId: req.body.accessKeyId,
						secretAccessKey: req.body.secretAccessKey,
						endpoint: req.body.endpoint,
						status: 'fail',
						message: req.body.name + ' already exists in s3motionClients.json'
					});
				}
			});
	    })
	    .get(function(req, res) {
	        listClients(function(data){
	            res.json(data);
			});
	    });

	router.route('/buckets/:client')
		.post(function(req, res) { 
	        var name = req.body.name;
	        getClient({name: req.params.client, client: 'aws'}, function(client){
				if (client == '') {
					res.status(404)
						.json({  
						operation: 'newBucket',
						client: req.params.client,
						status: 'fail',
						message: client + ' not found in s3motionClients.json. Create it using /clients'
					});
				} else {
					newBucket({site: client, bucket: name}, function(data) {
						res.json(data);
					});
				}
			});
	    })
		.get(function(req, res) { 
	        getClient({name: req.params.client, client: 'aws'}, function(client){
				if (client == '') {
					res.status(404)
						.json({  
						operation: 'listBuckets',
						client: req.params.client,
						status: 'fail',
						message: client + ' not found in s3motionClients.json. Create it using /clients'
					});
				} else {
					listBuckets({site: client}, function(data) {
						res.json(data);
					});
				}
			});
	    });

	router.route('/bucket/copy')
		.post(function(req, res) { 
	        getClient({name: req.body.sourceClient, client: 's3'}, function(sclient){
				if (sclient == '') {
					res.status(404)
						.json({  
						operation: 'bucketCopy',
						sourceClient: req.body.sourceClient,
						sourceBucket: req.body.sourceBucket,
						destClient: req.body.destClient,
						destBucket: req.body.destBucket,
						status: 'fail',
						message: req.body.sourceClient + ' not found in s3motionClients.json. Create it using /clients'
					});
				}
				var sourceClient = sclient;
				getClient({name: req.body.destClient, client: 's3'}, function(dclient){
					if (dclient == '') {
						res.status(404)
							.json({  
							operation: 'bucketCopy',
							sourceClient: req.body.sourceClient,
							sourceBucket: req.body.sourceBucket,
							destClient: req.body.destClient,
							destBucket: req.body.destBucket,
							status: 'fail',
							message: req.body.destClient + ' not found in s3motionClients.json. Create it using /clients'
						});
					}
					var destClient = dclient
					copyBucket({sourceSite: sourceClient, sourceBucket: req.body.sourceBucket, destinationSite: destClient, destinationBucket: req.body.destBucket}, function(data) {
						
					});
					res.json({  
						operation: 'bucketCopy',
						sourceClient: req.body.sourceClient,
						sourceBucket: req.body.sourceBucket,
						destClient: req.body.destClient,
						destBucket: req.body.destBucket,
						status: 'running',
					});
				});
			});
	    });

	router.route('/objects/:client/:bucket')
		.post(function(req, res) {
	        var folder = req.body.folder;
	        var objects = req.body.object.split(',');
			var objectsArrayLength = objects.length - 1;
	        getClient({name: req.params.client, client: 's3'}, function(client){
				if (client == '') {
					res.status(404)
						.json({  
						operation: 'objectUpload',
						objects: req.body.object,
						client: req.params.client,
						bucket: req.params.bucket,
						status: 'fail',
						message: req.params.client + ' not found in s3motionClients.json. Create it using /clients'
					});
				} else {
					if(folder == ''){
						folder = undefined;
					}
					uploadObject({site: client, bucket: req.params.bucket, file: objects, folder: folder}, function(data) {
						if (data instanceof Array){
							//
						} else if (data == chalk.green.bold(objects[objectsArrayLength] + " uploaded")) {
							res.json({  
								operation: 'objectUpload',
								objects: req.body.object,
								client: req.params.client,
								bucket: req.params.bucket,
								status: 'complete'
							});
						}
					});
				}
			});
	    })
		.get(function(req, res) { 
			getClient({name: req.params.client, client: 's3'}, function(client){
				if (client == '') {
					res.status(404)
						.json({  
						operation: 'objectList',
						client: req.params.client,
						bucket: req.params.bucket,
						status: 'fail',
						message: client + ' not found in s3motionClients.json. Create it using /clients'
					});
				} else {
					listObjects({site: client, bucket: req.params.bucket}, function(data) {
						res.json(data);
					});
				}
			});
	    })
	    .delete(function(req, res) {
	    	var objects = req.body.object.split(',');
			getClient({name: req.params.client, client: 's3'}, function(client){
				if (client == '') {
					res.status(404)
						.json({  
						operation: 'objectDelete',
						objects: objects.toString(),
						client: req.params.client,
						bucket: req.params.bucket,
						status: 'fail',
						message: client + ' not found in s3motionClients.json. Create it using /clients'
					});
				} else {
					deleteObject({site: client, bucket: req.params.bucket, file: objects}, function(data) {
						if (data instanceof Array){
							//
						} else {
							res.json({  
								operation: 'objectDelete',
								objects: objects.toString(),
								client: req.params.client,
								bucket: req.params.bucket,
								status: 'complete'
							});
						}
					});
				}
			});
	    });

	router.route('/object/copy')
		.post(function(req, res) { 
			var operation;
			if (req.body.delete == 'Y'){
				operation = 'objectMove';
			} else {
				operation = 'objectCopy';
			}
			getClient({name: req.body.sourceClient, client: 's3'}, function(sclient){
				if (sclient == '') {
					res.status(404)
						.json({  
						operation: operation,
						objects: req.body.object,
						sourceClient: req.body.sourceClient,
						sourceBucket: req.body.sourceBucket,
						destClient: req.body.destClient,
						destBucket: req.body.destBucket,
						status: 'fail',
						message: req.body.sourceClient + ' not found in s3motionClients.json. Create it using /clients'
					});
				} else {
					var sourceClient = sclient;
					getClient({name: req.body.destClient, client: 's3'}, function(dclient){
						if (dclient == '') {
							res.status(404)
								.json({  
								operation: operation,
								objects: req.body.object,
								sourceClient: req.body.sourceClient,
								sourceBucket: req.body.sourceBucket,
								destClient: req.body.destClient,
								destBucket: req.body.destBucket,
								status: 'fail',
								message: req.body.destClient + ' not found in s3motionClients.json. Create it using /clients'
							});
						} else {
							var destClient = dclient
							var objects = req.body.object.split(',');
							if (req.body.delete == 'Y'){
								moveObject({sourceSite: sourceClient, sourceBucket: req.body.sourceBucket, file: objects, destinationSite: destClient, destinationBucket: req.body.destBucket}, function(data) {
									//console.log(data);
								});
							} else {
								copyObject({sourceSite: sourceClient, sourceBucket: req.body.sourceBucket, file: objects, destinationSite: destClient, destinationBucket: req.body.destBucket}, function(data) {
									//console.log(data);
								});
							}
							res.json({ 
								operation: operation,
								objects: objects.toString(),
								sourceClient: req.body.sourceClient,
								sourceBucket: req.body.sourceBucket,
								destClient: req.body.destClient,
								destBucket: req.body.destBucket,
								status: 'running'
							});
						}
					});
				}
			});
	    });
	    
	
	// REGISTER OUR ROUTES -------------------------------
	// all of our routes will be prefixed with /api
	app.use('/api', router);

	// START THE SERVER
	// =============================================================================
	app.listen(port);
	console.log('Microservice started on port ' + port);

}

//commander for command line tools
program
	.version('0.1.0')
	.usage('-flag <Args> Supply only 1 flag. Args will vary based on flag. To use the wizard, type the flag and "wizard" (ie. s3motion -n wizard)')
	.option('-n, --newClient <--name --accessKeyId --secretAccessKey --endpoint>', 'Add a New Client (will be stored in clients.json)')
	.option('-L, --listClients', 'List clients')
	.option('-b, --listBuckets <--client>', 'List buckets for a specific client')
	.option('-N, --newBucket <--client --name>', 'Create a new bucket')
	.option('-l, --listObjects <--client --bucket>', 'List objects in a bucket')
	.option('-d, --downloadObject <--client --bucket --file --folder>', 'Download object(s) from bucket. Multiple file download supported by using commas and no spaces.')
	.option('-u, --uploadObject <--client --bucket --file --folder>', 'Upload object(s) to bucket. Multiple file upload supported by using commas and no spaces.')
	.option('-D, --deleteObject <--client --bucket --file>', 'Delete object(s) from bucket. Multiple deletion supported by using commas and no spaces.')
	.option('-c, --copyObject <--sourceClient --sourceBucket --file --destClient --destBucket --delete>', 'Copy object(s) between buckets. If --delete is Y, then source file is deleted after copy.')
	.option('-C, --copyBucket <--sourceClient --sourceBucket --destClient --destBucket>', 'Copy objects between buckets')
	.option('-R, --REST', 'Starts the REST based Web Service on port 8080')
	.parse(process.argv);

prompt.message = "";
prompt.delimiter = "";
prompt.colors = false;
prompt.override = optimist.argv;

if (program.newClient) {
	var questions = {
	    properties: {
		    	name: {
		    		description: 'Name: ',
		    		required: true
		    	},
		    	accessKeyId: {
		    		description: 'Access Key: ',
		    		required: true
		    	},
		    	secretAccessKey: {
		    		description: 'Secret Access Key: ',
		    		required: true
		    	},
		    	endpoint: {
		    		description: 'Endpoint (leave blank for AWS): ',
		    		required: false
		    	}
	    }
	};
	prompt.start();
	console.log('\n\n' + chalk.cyan('+----------------------+\n|                      |\n| CREATE NEW S3 CLIENT |\n|                      |\n+----------------------+') + '\n\n');
	prompt.get(questions, function (err, result) {
		if (err) {
			console.log('\n' +  chalk.red(err));
		} else {
			if(result.endpoint== ''){
				result.endpoint = undefined;
			}
			newClient({name: result.name, accessKeyId: result.accessKeyId, secretAccessKey: result.secretAccessKey, endpoint: result.endpoint}, function(data){
				console.log(data);
				process.exit;
			});
		}
	});
}

if (program.listClients) {
	console.log('\n\n' + chalk.cyan('+----------------------+\n|                      |\n|     LIST CLIENTS     |\n|                      |\n+----------------------+') + '\n\n');
	listClients(function(data){
		console.log(data);
	});
}

if (program.listBuckets) {
	var questions = {
	    properties: {
		    	client: {
		    		description: 'Client: ',
		    		required: true
		    	}
	    }
	};
	prompt.start();
	console.log('\n\n' + chalk.cyan('+----------------------+\n|                      |\n|     LIST BUCKETS     |\n|                      |\n+----------------------+') + '\n\n');
	prompt.get(questions, function (err, result) {
		if (err) {
			console.log('\n' +  chalk.red(err));
		} else {
			getClient({name: result.client, client: 'aws'}, function(client){
				if (client == '') {
					console.log(chalk.yellow(result.client) + chalk.red(" not found in s3motionClients.json. Create it using 's3motion -n wizard'"));
					process.exit(1);
				}
				listBuckets({site: client}, function(data) {
					console.log(data);
				});
			});
		}
	});
}

if (program.newBucket) {
	var questions = {
	    properties: {
		    	client: {
		    		description: 'Client: ',
		    		required: true
		    	},
		    	name: {
		    		description: 'New Bucket Name: ',
		    		required: true
		    	}
	    }
	};
	prompt.start();
	console.log('\n\n' + chalk.cyan('+----------------------+\n|                      |\n|      NEW BUCKET      |\n|                      |\n+----------------------+') + '\n\n');
	prompt.get(questions, function (err, result) {
		if (err) {
			console.log('\n' +  chalk.red(err));
		} else {
			getClient({name: result.client, client: 'aws'}, function(client){
				if (client == '') {
					console.log(chalk.yellow(result.client) + chalk.red(" not found in s3motionClients.json. Create it using 's3motion -n wizard'"));
					process.exit(1);
				}
				newBucket({site: client, bucket: result.name}, function(data) {
					console.log(chalk.green('Bucket successfully created '));
					console.log(data);
				});
			});
		}
	});
}

if (program.listObjects) {
	var questions = {
	    properties: {
		    	client: {
		    		description: 'Client: ',
		    		required: true
		    	},
		    	bucket: {
		    		description: 'Bucket: ',
		    		required: true
		    	}
	    }
	 };
	prompt.start();
	console.log('\n\n' + chalk.cyan('+----------------------+\n|                      |\n|     LIST OBJECTS     |\n|                      |\n+----------------------+') + '\n\n');
	prompt.get(questions, function (err, result) {
		if (err) {
			console.log('\n' +  chalk.red(err));
		} else {
			getClient({name: result.client, client: 's3'}, function(client){
				if (client == '') {
					console.log(chalk.yellow(result.client) + chalk.red(" not found in s3motionClients.json. Create it using 's3motion -n wizard'"));
					process.exit(1);
				}
				listObjects({site: client, bucket: result.bucket}, function(data) {
					console.log(data);
				});
			});
		}
	});

}

if (program.downloadObject) {
	var questions = {
	    properties: {
		    	client: {
		    		description: 'Client: ',
		    		required: true
		    	},
		    	bucket: {
		    		description: 'Bucket: ',
		    		required: true
		    	},
		    	file: {
		    		description: "Object(s)/File(s) (seperate with comma ',' and no spaces): ",
		    		required: true
		    	},
		    	folder: {
		    		description: "Download location (optional, default is current directory): ",
		    		required: false
		    	}
	    }
	 };
	prompt.start();
	console.log('\n\n' + chalk.cyan('+----------------------+\n|                      |\n|    DOWNLOAD OBJECT   |\n|                      |\n+----------------------+') + '\n\n');
	prompt.get(questions, function (err, result) {
		if (err) {
			console.log('\n' +  chalk.red(err));
		} else {
			getClient({name: result.client, client: 's3'}, function(client){
				if (client == '') {
					console.log(chalk.yellow(result.client) + chalk.red(" not found in s3motionClients.json. Create it using 's3motion -n wizard'"));
					process.exit(1);
				}
				if(result.folder == ''){
				result.folder = undefined;
				}
				var files = result.file.split(',');
				downloadObject({site: client, bucket: result.bucket, file: files, folder: result.folder}, function(data) {
					if (data instanceof Array){
						var bar = new ProgressBar('downloading ' + chalk.blue(data[0]) + ' [:bar] ' + chalk.cyan(':percent'), {
						    complete: chalk.green('='),
						    incomplete: ' ',
						    width: 30,
						    total: data[2]
						});
						bar.tick(data[1]);
					} else {
						//console.log(data);
					}

				});
			});
		}
	});
}

if (program.uploadObject) {
	var questions = {
	    properties: {
		    	client: {
		    		description: 'Client: ',
		    		required: true
		    	},
		    	bucket: {
		    		description: 'Bucket: ',
		    		required: true
		    	},
		    	file: {
		    		description: "Object(s)/File(s) (seperate with comma ',' and no spaces): ",
		    		required: true
		    	},
		    	folder: {
		    		description: "Upload location (optional, default is current directory): ",
		    		required: false
		    	}
	    }
	 };
	prompt.start();
	console.log('\n\n' + chalk.cyan('+----------------------+\n|                      |\n|     UPLOAD OBJECT    |\n|                      |\n+----------------------+') + '\n\n');
	prompt.get(questions, function (err, result) {
		if (err) {
			console.log('\n' +  chalk.red(err));
		} else {
			getClient({name: result.client, client: 's3'}, function(client){
				if (client == '') {
					console.log(chalk.yellow(result.client) + chalk.red(" not found in s3motionClients.json. Create it using 's3motion -n wizard'"));
					process.exit(1);
				}
				if(result.folder == ''){
					result.folder = undefined;
				}
				var files = result.file.split(',');
				uploadObject({site: client, bucket: result.bucket, file: files, folder: result.folder}, function(data) {
					if (data instanceof Array){
						var bar = new ProgressBar('uploading ' + chalk.blue(data[0]) + ' [:bar] ' + chalk.cyan(':percent'), {
						    complete: chalk.green('='),
						    incomplete: ' ',
						    width: 30,
						    total: data[2]
						});
						bar.tick(data[1]);
					} else {
						//console.log(data);
					}
				});
			});
		}
	});
}

if (program.deleteObject) {
	var questions = {
	    properties: {
		    	client: {
		    		description: 'Client: ',
		    		required: true
		    	},
		    	bucket: {
		    		description: 'Bucket: ',
		    		required: true
		    	},
		    	file: {
		    		description: "Object(s)/File(s) (seperate with comma ',' and no spaces): ",
		    		required: true
		    	}
	    }
	 };
	prompt.start();
	console.log('\n\n' + chalk.cyan('+----------------------+\n|                      |\n|     DELETE OBJECT    |\n|                      |\n+----------------------+') + '\n\n');
	prompt.get(questions, function (err, result) {
		if (err) {
			console.log('\n' +  chalk.red(err));
		} else {
			var files = result.file.split(',');
			getClient({name: result.client, client: 's3'}, function(client){
				if (client == '') {
					console.log(chalk.yellow(result.client) + chalk.red(" not found in s3motionClients.json. Create it using 's3motion -n wizard'"));
					process.exit(1);
				}
				deleteObject({site: client, bucket: result.bucket, file: files}, function(data) {
					if (data instanceof Array){
						var bar = new ProgressBar('deleting [:bar] ' + chalk.cyan(':percent'), {
						    complete: chalk.green('='),
						    incomplete: ' ',
						    width: 30,
						    total: data[1]
						});
						bar.tick(data[0]);
					} else {
						console.log(data);
					}
				});
			});
		}
	});
}

if (program.copyObject) {
	var questions = {
	    properties: {
		    	sourceClient: {
		    		description: 'Source Client: ',
		    		required: true
		    	},
		    	sourceBucket: {
		    		description: 'Source Bucket: ',
		    		required: true
		    	},
		    	file: {
		    		description: "Object(s)/File(s) (seperate with comma ',' and no spaces): ",
		    		required: true
		    	},
		    	destClient: {
		    		description: 'Destination Client: ',
		    		required: true
		    	},
		    	destBucket: {
		    		description: 'Destination Bucket: ',
		    		required: true
		    	},
		    	delete: {
		    		description: 'Delete source file after copy? (default "n") (Y/n): ',
		    		default: 'n',
		    		required: false
		    	}
	    }
	 };
	prompt.start();
	console.log('\n\n' + chalk.cyan('+----------------------+\n|                      |\n|      COPY OBJECT     |\n|                      |\n+----------------------+') + '\n\n');
	prompt.get(questions, function (err, result) {
		if (err) {
			console.log('\n' +  chalk.red(err));
		} else {
			getClient({name: result.sourceClient, client: 's3'}, function(sclient){
				var sourceClient = sclient;

				getClient({name: result.destClient, client: 's3'}, function(dclient){
					var destClient = dclient
					var files = result.file.split(',');
					if (result.delete == 'Y'){
						moveObject({sourceSite: sourceClient, sourceBucket: result.sourceBucket, file: files, destinationSite: destClient, destinationBucket: result.destBucket}, function(data) {
							//console.log(data);
						});
					} else {
						copyObject({sourceSite: sourceClient, sourceBucket: result.sourceBucket, file: files, destinationSite: destClient, destinationBucket: result.destBucket}, function(data) {
							//console.log(data);
						});
					}
				});
			});			
		}
	});
}

if (program.copyBucket) {
	var questions = {
	    properties: {
		    	sourceClient: {
		    		description: 'Source Client: ',
		    		required: true
		    	},
		    	sourceBucket: {
		    		description: 'Source Bucket: ',
		    		required: true
		    	},
		    	destClient: {
		    		description: 'Destination Client: ',
		    		required: true
		    	},
		    	destBucket: {
		    		description: 'Destination Bucket: ',
		    		required: true
		    	}
	    }
	 };
	prompt.start();
	console.log('\n\n' + chalk.cyan('+----------------------+\n|                      |\n|      COPY BUCKET     |\n|                      |\n+----------------------+') + '\n\n');
	prompt.get(questions, function (err, result) {
		if (err) {
			console.log('\n' +  chalk.red(err));
		} else {
			getClient({name: result.sourceClient, client: 's3'}, function(sclient){
				if (sclient == '') {
					console.log(chalk.yellow(result.client) + chalk.red(" not found in s3motionClients.json. Create it using 's3motion -n wizard'"));
					process.exit(1);
				}
				var sourceClient = sclient;

				getClient({name: result.destClient, client: 's3'}, function(dclient){
					if (dclient == '') {
						console.log(chalk.yellow(result.client) + chalk.red(" not found in s3motionClients.json. Create it using 's3motion -n wizard'"));
						process.exit(1);
					}
					var destClient = dclient
					copyBucket({sourceSite: sourceClient, sourceBucket: result.sourceBucket, destinationSite: destClient, destinationBucket: result.destBucket}, function(data) {
						//
					});
				});
			});	
		}
	});
}

if (program.REST) {
	microservice();
}