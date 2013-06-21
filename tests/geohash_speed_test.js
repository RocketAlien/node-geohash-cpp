var path = require('path');
var mocha = require('mocha');
var chai = require('chai');
var should = chai.should();

var longitude = 112.5584;
var latitude = 37.8324;
var geostr = 'ww8p1r4t8';

// Helpers

function seconds_per_call(callback) {
	var time = process.hrtime(); // Start
	callback(); // Execute 
	var diff = process.hrtime(time); // Stop
	var seconds = diff[0].valueOf() + diff[1].valueOf() / (1000 * 1000 * 1000);

	return seconds / (1000 * 1000);
};

// Helpers

function wrap_loop_1M_in_js(callback, validates) {
	return function() {
		var last = null;
		for (var i = 0, max = 1000 * 1000; i < max; i++) {
			last = callback();
		}
		return validates(last);
	};
}

function seconds_per_call_loop_1M(callback, validates) {
	return seconds_per_call(wrap_loop_1M_in_js(callback, validates));
}


function encode_latitude_and_longitude_as_string(geohash) {
	return geohash.encode(latitude, longitude, 9);
}

function decodes_string_to_latitude(geohash) {
	return geohash.decode(geostr)
		.latitude;
}

function decodes_string_to_longitude(geohash) {
	return geohash.decode(geostr)
		.longitude;
}

function finds_neighbor_to_the_north(geohash) {
	return geohash.neighbor('dqcjq', [1, 0]);
}

function finds_neighbor_to_the_south_west(geohash) {
	return geohash.neighbor('dqcjq', [-1, - 1]);
}


var geohash_obj = new require('../geohash.js')
	.geohash_object;
var geohash_js = require('../geohash.js');
var geohash_original = require('./geohash_original.js');

geohash_original.test1m_encode = function(a, b, c) {
	var last = undefined;
	for(var i = 0, max = 1000*1000; i < max; i++) {
		last = geohash_original.encode(a, b, c);
	}
	return last;
}

geohash_original.test1m_decode = function(a) {
	var last = undefined;
	for(var i = 0, max = 1000*1000; i < max; i++) {
		last = geohash_original.decode(a);
	}
	return last;
}

geohash_original.test1m_neighbor = function(a, b) {
	var last = undefined;
	for(var i = 0, max = 1000*1000; i < max; i++) {
		last = geohash_original.neighbor(a, b);
	}
	return last;
}


// Validate the expected speed of the function calls
describe('Speed Tests', function() {
	this.timeout(0);

	function compare_ratios(tag, src, js, cpp, validates) {
		describe(tag, function() {
			var seconds = {
				src: seconds_per_call_loop_1M(src, validates),
				js: seconds_per_call_loop_1M(js, validates),
				cpp: seconds_per_call(function() {
					validates(cpp());
				}),
			};
			var ratios = {
				src: 1.0,
				js: seconds.js / seconds.src,
				cpp: seconds.cpp / seconds.src,
			}

			var ratios_to_s = JSON.stringify(ratios);
			console.log(tag + ': ' + ratios_to_s);

			it('[Ratios]', function() {
				chai.assert.ok(ratios.src == 1.0, ratios_to_s);
				chai.assert.ok(ratios.js > ratios.src, ratios_to_s);
				chai.assert.ok(ratios.cpp < ratios.src, ratios_to_s);
			})

			it('[Times]', function() {
				chai.assert.ok(seconds.src <= 0.0000001, ratios_to_s);
				chai.assert.ok(seconds.js <= 0.0000001, ratios_to_s);
				chai.assert.ok(seconds.cpp <= 0.0000001, ratios_to_s);
			})
		});
	};

	compare_ratios('encodes latitude & longitude as string',

	function() {
		return encode_latitude_and_longitude_as_string(geohash_original);
	},

	function() {
		return encode_latitude_and_longitude_as_string(geohash_js);
	},

	function() {
		return geohash_obj.test1m_encode(latitude, longitude, 9);
	},

	function(data) {
		data.should.equal(geostr);
	});

	compare_ratios('decodes string to latitude',

	function() {
		return decodes_string_to_latitude(geohash_original);
	},

	function() {
		return decodes_string_to_latitude(geohash_js);
	},

	function() {
		return geohash_obj.test1m_decode(geostr)
			.latitude;
	},

	function(data) {
		var diff = Math.abs(latitude - data) < 0.0001
		var msg = 'Expected ' + latitude + '-' + data + ' to be very close'
		chai.assert.ok(diff, msg);
	}

	);

	compare_ratios('decodes string to longitude',

	function() {
		return decodes_string_to_longitude(geohash_original);
	},

	function() {
		return decodes_string_to_longitude(geohash_js);
	},

	function() {
		return geohash_original.test1m_decode(geostr)
			.longitude;
	},

	function(data) {
		var diff = Math.abs(longitude - data) < 0.0001
		var msg = 'Expected ' + longitude + '-' + data + ' to be very close'
		chai.assert.ok(diff, msg);
	}

	);

	compare_ratios('finds neighbor to the north',

	function() {
		return finds_neighbor_to_the_north(geohash_original);
	},

	function() {
		return finds_neighbor_to_the_north(geohash_js);
	},

	function() {
		return geohash_obj.test1m_neighbor('dqcjq', [1, 0]);
	},

	function(data) {
		data.should.equal('dqcjw');
	});

	compare_ratios('finds neighbor to the south-west',

	function() {
		return finds_neighbor_to_the_south_west(geohash_original);
	},

	function() {
		return finds_neighbor_to_the_south_west(geohash_js);
	},

	function() {
		return geohash_obj.test1m_neighbor('dqcjq', [-1, - 1]);
	},

	function(data) {
		data.should.equal('dqcjj');
	});
});
