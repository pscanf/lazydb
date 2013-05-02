var START = Date.now();
var lazydb = require("./lazydb.js");
var fs = require("fs");
var crypto = require("crypto");

var hash = function (buffer) {
	var hash = crypto.createHash("sha256");
	hash.update(buffer);
	return hash.digest("hex");
};

var test = {};
var db;

test.batch_put = function (size, callback) {
	var keys = [];
	var values = [];

	var push_kvp = function (i, callback) {
		if (i===size) {
			callback(false);
			return;
		}
		crypto.randomBytes(512, function (err, buffer) {
			if (err) {
				callback("Error generating random bytes");
				return;
			}
			keys[i] = buffer.slice(0, 256);
			values[i] = buffer.slice(256, 512);
			push_kvp(i+1, callback);
		});
	};

	var put_kvp = function (i, callback) {
		if (i===size) {
			callback(false);
			return;
		}
		db.put(keys[i], values[i], function (err) {
			if (err) {
				callback(err);
				return;
			}
			put_kvp(i+1, callback);
		});
	};

	//console.log("Putting " + size + " random key/value pairs");

	push_kvp(0, function (err) {
		if (err) {
			console.log(err);
			return;
		}
		put_kvp(0, function (err) {
			if (err) {
				console.log(err);
				return;
			}
			callback(keys, values);
		});
	});
};

test.verify_put = function (keys, values) {
	//console.log("Verifying...");
	for (var i=0; i<keys.length; i++) {
		if ( db.get(keys[i]).toString() !== values[i].toString() ) {
			console.log("Error: value number" + i + "doesn't match!");
			return;
		}
	}
	//console.log("Everything's ok");
};

test.put = function (size, callback) {
	//console.log("");
	//console.log("BEGIN PUT TEST");
	var start = Date.now();
	test.batch_put(size, function (keys, values) {
		test.verify_put(keys, values);
		var stop = Date.now();
	//	console.log("END PUT TEST");
	//	console.log("Time taken = " + (stop - start) + " ms");
		callback();
	});
};

test.lsk = function () {
	console.log("");
	console.log("BEGIN LSK TEST");
	var start = Date.now();
	var keys = db.lsk();
	var stop = Date.now();
	console.log(keys.length);
	console.log("END LSK TEST");
	console.log("Time taken = " + (stop - start) + " ms");
};

test.get = function (cicles) {
	console.log("");
	var keys = db.lsk();
	var key = keys[0];
	var start = Date.now();
	console.log("BEGIN GET TEST");
	console.log("Getting " + cicles + " values");
	for (var i=0; i<cicles; i++) {
		db.get(key);
	}
	var stop = Date.now();
	console.log("END GET TEST");
	console.log("Time taken = " + (stop - start) + " ms");
};

test.open = function () {
	console.log("");
	console.log("BEGIN OPEN TEST");
	var start = Date.now();
	db = lazydb.open("./contacts");
	var stop = Date.now();
	console.log("END OPEN TEST");
	console.log("Time taken = " + (stop - start) + " ms");
};

test.del = function () {
	console.log("");
	console.log("BEGIN DEL TEST");
	var keys = db.lsk();
	var logerr = function (err) {
		if (err) {
			console.log(err);
		}
	};
	var start = Date.now();
	for (var i=0; i<keys.length; i++) {
		db.del(keys[i], logerr);
	}
	var stop = Date.now();
	console.log(keys.length);
	console.log("END DEL TEST");
	console.log("Time taken = " + (stop - start) + " ms");
};

var init_test = function (times) {
	test.open();
	//test.lsk();
	test.del();
};

init_test(10000);
process.on("exit", function () {
	var STOP = Date.now();
	console.log("Time taken = " + (STOP - START) + " ms");
});
