var AWS = require('aws-sdk'); 
var fs = require('fs');
var s3 = require('s3');

var s3Client = function(accessKeyId, secretAccessKey, endpoint) {
	var s3object = new AWS.S3({accessKeyId: accessKeyId, secretAccessKey: secretAccessKey, endpoint: endpoint});
	var options = {
		s3Client: s3object,
	}
	var client = s3.createClient(options);
	return client;
}

var downloadObject2 = function(sourceSite, bucketName, file, destinationSite) {
	var params = {
	  localFile: file,

	  s3Params: {
	    Bucket: bucketName,
	    Key: file,
	  },
	};
	var downloader = sourceSite.downloadFile(params);
	downloader.on('error', function(err) {
	  console.error("unable to download:", err.stack);
	});
	downloader.on('progress', function() {
	  console.log("progress", downloader.progressAmount, downloader.progressTotal);
	});
	downloader.on('end', function() {
	  console.log("done downloading");
	  objectUpload(destinationSite, 's3motion_vipr01', file);
	});

}

var objectUpload = function(destinationSite, bucketName, file) {
	var params = {
	  localFile: file,

	  s3Params: {
	    Bucket: bucketName,
	    Key: file,
	  },
	};
	var uploader = destinationSite.uploadFile(params);
	uploader.on('error', function(err) {
	  console.error("unable to upload:", err.stack);
	});
	uploader.on('progress', function() {
	  console.log("progress", uploader.progressMd5Amount,
	            uploader.progressAmount, uploader.progressTotal);
	});
	uploader.on('end', function() {
	  console.log("done uploading");
	});
}

var s3site = s3Client('awskey', 'awssecret');
var ViPRsite = s3Client('viprkey', 'viprsecret', 'object.vipronline.com')

downloadObject2(s3site, 'bucketName', 'file.extension', ViPRsite);