var mStream = require('stream');
var mUtil = require('util');

var UUEncode = function(options) {
    this.options = options || {decoder: true,
			       outFileName: undefined,
			       outMod: "664"
			      };
    this.readable = true;
    this.writable = true;
    this.mod = this.filename = null;

    this._encodeLineBuffer = [];
    this._encodeByteBuffer = [];
    this._encodeLineLength = 0;

    this.decodeHead = ""; // used for complete lines
    this.decodeTail = "";
    this._decodeByteLength = 0;
};

mUtil.inherits(UUEncode, mStream);

var decodeMethods = {
    'parseHeader': function ( data ) {
	var header = data.split(' ');
	this.mod = data[1];
	this.filename = data[2];
    },
    '_decodeLine': function (line){
	var bytes = (line.charCodeAt(0) - 32);
	var a, b, c, d;
	if (bytes == 64) { // "`" - 32
	    bytes = 0;
	    return false;
	};

	var chunks = Math.ceil(bytes / 3) * 4; // (6 to 8 conversion)
	var j = 1;
	var a, b, c, d, data;
	while (j < chunks){
	    a = line.charCodeAt(j++) - 32;
	    b = line.charCodeAt(j++) - 32;
	    c = line.charCodeAt(j++) - 32;
	    d = line.charCodeAt(j++) - 32;
	    
	    data = a << 18;
	    data += b << 12
	    data += c << 6;
	    data += d << 0;

	    var b1, b2, b3;
	    var buffArray = [
		(data >> 16) & 255,
		(data >> 8) & 255,
		data & 255];
	    
	    this._decodeByteLength += 3;
	    if (this._decodeByteLength > bytes)	    {
		for (var k = 0; k < this._decodeByteLength - bytes; k ++)
		    buffArray.pop();
	    };

	    retBuf = new Buffer(buffArray);
	    
	    this.emit('data', retBuf);
	};
	return true;
    },
    'decode': function (buffer){
	var self = this;
	dataLines = buffer.toString().split("\n");

	dataLines[0] = this.decodeTail + dataLines[0];
	this.decodeTail = dataLines.pop();
	for (var l = 0; l < dataLines.length; l ++){
	    if (!self.mod) {
		self.parseHeader(dataLines[l])
	    } else if (!self._decodeLine(dataLines[l])) {
		break;
	    }
	};
    }
};

var methods = {
    'writeHeader': function () {
	if (!this.mod){
	    var headerString = "begin ";
	    headerString += this.options.outMod || "664 ";
	    headerString += this.options.outFileName || "out.file";
	    this.emit('data', headerString);
	    this.mod = true;
	};
    },

    'end': function (){
	if (!this.options.decoder){
	    this._encodeBytes(true);
	    this._encodeLine(true);
	};
	this.emit('end');
    },

    
    '_bitString': function(d, bits){
	var array = [];
	while (--bits > -1) {
	    array.push(d % 2)
	    d = d >> 1;
	};
	var str = array.reverse().join("");
	return str
    },
    '_encodeLine': function (flush) {
	if (!this.options.decoder)
	    this.writeHeader();

	if (this._encodeLineBuffer.length == 60 || flush){
	    var line = String.fromCharCode(this._encodeLineLength + 32);
	    line += this._encodeLineBuffer.map(function (c){
		return String.fromCharCode(c);
	    }).join("");
	    this.emit('data', line + "\n");
	};
	if (flush)
	    this.emit('data', '`\nend\n');
    },
    '_encodeBytes': function (){
	if (this._encodeByteBuffer.length == 0)
	    return;

	var data = 0;
	for (var i = 0; i < this._encodeByteBuffer.length; i ++) {
	    if (this._encodeByteBuffer[i] === undefined)
		return;
	    data += this._encodeByteBuffer[i] << (16  - (i * 8));
	}

	var a = ((data >> 18) & 63) + 32;
	var b = ((data >> 12) & 63) + 32;
	var c = ((data >> 6) & 63) + 32;
	var d = (data & 63) + 32;
	
	this._encodeLineBuffer.push.apply(this._encodeLineBuffer, [a, b, c, d]);
	this._encodeLine();

    },
    '_encodeByte': function(byte){
	this._encodeByteBuffer.push(byte);
	if (this._encodeByteBuffer.length == 3) {
	    this._encodeBytes();
	    this._encodeByteBuffer = [];
	};
    },
    'encode': function (buffer){
	this.emit('data', 'begin 664 out\n');
	for (var  ii = 0; ii < buffer.length; ii ++){
	    this._encodeLineLength ++;
	    this._encodeByte(buffer.readUInt8(ii));
	};
    },
    'write': function ( data ){
	if (this.options.decoder){
	    this.decode(data);
	} else {
	    this.encode(data);
	};
    }
}

Object.keys(methods).forEach(function (key){
    UUEncode.prototype[key] = methods[key];
});
Object.keys(decodeMethods).forEach(function (key){
    UUEncode.prototype[key] = decodeMethods[key];
});

module.exports = UUEncode;


