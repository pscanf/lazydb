var lazydb = require("./lazydb.js");
var fs = require("fs");
var crypto = require("crypto");

var hash = function (buffer) {
	var hash = crypto.createHash("sha256");
	hash.update(buffer);
	return hash.digest("hex");
};

var db;

var test = {};

test.batch_put = function (callback) {
	var size = 10;
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

test.verify_put = function (keys, values, callback) {
	var size = keys.length;
	var get_kvp = function (i, callback) {
		if (i===size) {
			callback(false);
			return;
		}
		db.get(keys[i], function (err, value) {
			if (err) {
				callback(err);
				return;
			}
			if (value.toString()!==values[i].toString()) {
				console.log("Error: different values");
				console.log(i);
				callback(true);
				return;
			}
			get_kvp(i+1, callback);
		});
	};
	get_kvp(0, function (err) {
		if (err) {
			console.log("Errors occurred");
			callback();
			return;
		}
		console.log("Everything went ok");
		callback();
	});
};

test.put = function () {
	console.log("BEGIN TEST");
	test.batch_put(function (keys, values) {
		test.verify_put(keys, values, function () {
			console.log("END TEST");
		});
	});
};

test.lsk = function () {
	db.lsk(function (err, keys) {
		if (err) {
			console.log(err);
		}
		console.log(keys);
	});
};

var init_test = function () {
	test.lsk();
};

lazydb.open("./contacts", function (err, database) {
	if (err) {
		console.log(err);
	}
	db = database;
	init_test();
});
