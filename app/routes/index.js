'use strict';

var path = process.cwd();
var mongoose = require('mongoose');
var multer = require('multer');
var upload = multer({dest: path+'/public/uploads'});
var Query = require('../models/query');
var id = null;

module.exports = function(app){
	app.route('/').get(function(req,res){res.sendFile(path + '/public/index.html');});
	// count existing collections - debug
	mongoose.connect(process.env.MONGO_URI,function(err,db){
		if (err) throw err;
		var con = mongoose.connection;
		con.on('error', console.error);
		con.once('open', function(){
			console.log('> test connection established');
		    con.db.listCollections().toArray(function(err,data){
		    	if (err) throw err;
		        console.log('listCollections: '+JSON.stringify(data));
		        if (data.length == 0) console.log('"queries" collection should be created');
		        else console.log('"queries" collection exists');
		        con.close();
		    });
		});
		con.once('close', function(){console.log('> test connection closed');});
	});
	// handle POST request
	app.post('/filepost/', upload.single('file'), function (req, res, next) {
		if (req.file){
			console.log("req.url: "+req.url);
			// req.file is the `avatar` file 
			// req.body will hold the text fields, if there were any 
			var file = req.file;
			var body = req.body;
			console.log("file: "+JSON.stringify(file)+"\nbody: "+JSON.stringify(body));
			var fileName = file.originalname;
			var fileSize = file.size;
			var output = [];
			output.push({"name":fileName,"size":fileSize});
			// get current date
			var dateLog = "";
			var date = new Date();
				var year = date.getFullYear();
				var month = date.getMonth()+1;
				if (month <10) month = "0"+month;
				var day = date.getDate();
				var hours = date.getHours();
				var minutes = date.getMinutes();
				if (minutes <10) minutes = "0"+minutes;
				dateLog = year+"-"+month+"-"+day+" "+hours+":"+minutes;
			mongoose.connect(process.env.MONGO_URI,function(err){
				if (err) throw err;
				var con = mongoose.connection;
				con.on('error', console.error);
				con.once('open', function(){
					console.log('> connection established on endpoint: /filepost/');
					console.log('dateLog: '+dateLog);
				    con.db.collection('queries').find().toArray(function(err,data){
				    	if (err) throw err;
				        console.log('"queries" collection: '+JSON.stringify(data));
				        id = data.length + 1;
				        console.log('next id: '+id);
					    // prepare new record
					    var newQuery = new Query();
						newQuery._id = id;
						newQuery.name = fileName;
						newQuery.size = fileSize;
						newQuery.when = dateLog;
						newQuery.save(function (err) {
							if (err) throw err;
							console.log('data saved');
							con.close();
						});
						console.log(newQuery);
				    });
				});
				con.once('close', function(){
					console.log('> connection closed on endpoint: /filepost/');
			        res.format({
						'application/json': function(){
							res.send(output);
			        		res.end();
						}
					});
				});
			});
		}else{
			console.log('error: file is missing');
			console.log('> connection closed on endpoint: /filepost/');
	        res.format({
				'application/json': function(){
					res.send('[{"Error":"file is missing"}]');
	        		res.end();
				}
			});
		}
	});
	// show queries log
	app.route('/queries/').get(function(req,res){
		mongoose.connect(process.env.MONGO_URI,function(err,db){
			if (err) throw err;
			var output = "";
			var con = mongoose.connection;
			con.on('error', console.error);
			con.once('open', function(){
				console.log('> connection established on endpoint: /queries/');
			    con.db.collection('queries').find().toArray(function(err,data){
			    	if (err) throw err;
			    	console.log('all docs: '+JSON.stringify(data));
			    	for (var i=0; i<data.length; i++){
			    		delete data[i]["_id"];
			    		delete data[i]["__v"];
			    	}
			    	output = data;
			        con.close();
			    });
			});
			con.once('close', function(){
				console.log('> connection closed on endpoint: /queries/');
				res.format({
					'application/json': function(){
						if (output.length > 0) res.send(output);
						else res.send('[{"Response":"there are no query records yet."}]');
		        		res.end();
					}
				});
			});
		});
	});
	// clear queries log
	app.route('/cleardata/').get(function(req,res){
		mongoose.connect(process.env.MONGO_URI,function(err,db){
			if (err) throw err;
			var con = mongoose.connection;
			con.on('error', console.error);
			con.once('open', function(){
				console.log('> connection opened on endpoint: /cleardata/');
			    con.db.listCollections().toArray(function(err,data){
			    	if (err) throw err;
			        console.log('listCollections: '+JSON.stringify(data));
			        if (data.length == 0) {
			        	console.log('"queries" collection does not exist');
			        	con.close();
			        }else {
			        	console.log('"queries" collection exists, clearing collection');
			        	con.db.collection('queries').remove({}, function(err,data){
							if(err) throw err;
							console.log('removed');
							con.close();
						});
			        }
			    });
			});
			con.once('close', function(){
				console.log('> connection closed on endpoint: /cleardata/');
				res.format({
					'application/json': function(){
						res.send('[{"Response":"data cleared"}]');
		        		res.end();
					}
				});
			});
		});
	});
};