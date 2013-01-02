var uuencode = require ('../lib/uuencode');
var fs = require ('fs');

var inFile = './data/test.raw';

function test(){
    data = "";
    var infs = fs.createReadStream(inFile)
	.on('open', function (){
	    infs
		.pipe(new uuencode({encoder: true}))
		.on('data', function (data){
		})
		.pipe(new uuencode({decoder: true}))
		.on('data', function (d){
		    data += d;
		})
		.on('end', function () {
		    console.log(data);
		});
	})
    };

test();