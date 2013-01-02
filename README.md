js-uuencode
===========

UUEncode Library for Javascript

Usage:
  Command line
  ./bin/uuencode input output
  ./bin/uudecode input ouput

  Streams

```javascript  
var uuencode = require ('uuencode');
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
```