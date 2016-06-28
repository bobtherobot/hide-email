/*

-----------------------------
Hide Email Address
v1.0
-----------------------------

            ___                            
    _____  |__| ___   ____   __   _.___
  /  __  \|  |/ __ \|  ___|/   \ |     \ 
 |  |_|  |  |  ___/ \___  |  |  |   |  |
 \___   |__|\_____ \____/ \___/|___|__|
|______|                     



Copyright (c) 2016 Mike Gieson.
http://gieson.com

MIT License

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

this.gieson = this.gieson || {};


/*
This function will generate an all-inclusive <a> tag (no dependancies)
for both the encrypted and non-encrypted versions.

When encrypted, an <a> tag is generateed and a blob is delivered to 
a function in the onclick, and subsequently decoded "on-the-fly".

When non-encrypted, an <a> tag is created and the onclick event 
contains a function to parse the attributes and generate a "mailto" URL. 
This allows the <a> tag to be edited without having to re-generate the 
entire <a> tag. While not as secure, it's more flexible for HTML authors.

	Where data-attributes will contain 4 things:
		data-u = first half of the email (user)
		data-d = second half of email (domain)
		data-s = email subject (optional)
		data-b = email body (optional)

*/

(function (){
	
	/*
	In order to store 256 characters (the extended ASCII table contains 255 characters)
	we'll need a minimum of 16 bits, but randomizing between 16 and 36 will pepper some 
	confusion for the bots (36 is the max integer-base that javascript's toString(base) 
	will allow), .

	But most western characters reside < 128 range, so we can go down as far as 12 bits.

	Taking it another step further, if we read the string and discover that none of the 
	characters in the string exceed a charCode of 99, we can theoretically go down to 10 bits.
	But that would more-than-likely require only upper-case characters and no curly-brackets, 
	pipe, tilda.

	So we can derive a minimum bit value based on the highest character-to-integer (charCode)
	found in the text to be encoded. And we'll need to store this bit value in the encoded
	text some how.

	So the process is as follows:
	1. Comb through the string to-be-encoded and derive the highest charCode number
		to determine the lowest bit value needed to store all the characters.
	2. The bit value discovered in #1 is our "base", so we can now encode the string
		using the provided bit value.
	3. For decoding, we'll need the numeric bit value derived in #1, so we'll need to store
		that "base" number somewhere. I've decided to split the number and put half in front
		and half on the back. Explaination to follow:

	Since our overall range is ~12 to 36, we know that the value will be 2 digits, 
	so we'll split the 2-digit number to get a string representation and put the first number 
	character at the front of the string and the second at the back.

	e.g.
	var base = 16
	var encoded = "zzz"
	var result = "1zzz6"

	So the "result" contains the encoded text plus the "base" bit value.

	To decode, extract the first and last characters and combine into a string 
	and convert ot a number.

	var encrpted = "1zzz6"
	var base1 = encrpted.slice(0, 1);
	var base2 = encrpted.slice(-1);
	var meat = encrpted.slice(1, -1);
	var base = Number(base1.toString() + base2.toString());

	*/

	// -----------------
	// Number converter
	// -----------------
	// Used for encoding as well as for testing decodeEncrypted.
	// 
	// Converts numbers from base-to-base and returns a string
	//
	// Examples:
	// 	convert(123, 2, 10) 	// binary to decimal
	// 	convert(123, 10, 2) 	// decimal to binary
	// 	convert(123, 16, 10) 	// hex to decimal
	// 	convert(123, 10, 16) 	// decimal to hex
	// 	convert(123, 2, 16) 	// binary to hex
	// 	convert(123, 16, 2) 	// hex to binary

	function convert(num, from, to){
		return parseInt(num, from).toString(to);
	}

	
	// --------------------
	// Decoder Part
	// --------------------
	
	// Expanded for testing
	function decodeEncrypted(str){
		// Probably don't need to ensure its a number, since javascript parseInt parses as a number already?
		// var base = Number(str.slice(0, 1) + "" + str.slice(-1));
		// The + "" + maintains string values and prevents number addition.
		var base = str.slice(0, 1) + "" + str.slice(-1);
		//str = str.substring(1,str.length-1);
		str = str.slice(1,-1);
		var out = "";
		for(var i=0; i<str.length; i+=2){
			/*
			var bit = str.substr(i, 2);
			var num = convert(bit, base, 10);
			var ch = String.fromCharCode(num);
			out += ch;
			*/

			out += String.fromCharCode( convert( str.substr(i, 2) , base, 10) );

			// Embed the convert functionality directly:
			// out += String.fromCharCode( parseInt(str.substr(i, 2), base).toString(10) );
			
		}
		return out;
	}

	// Expanded for testing
	function decodeNormal(elem){
		var data = {};
	
		var atts = elem.attributes;
	
		// Reverse through the array to minimize characters in final.
		// for(var i = 0; i < atts.length; i++){
		for(var i = atts.length; i--; ){
	
			var me = atts[i].name;
			// chopping "data-" = 5 characters to get the X from data-X attributes.
			//
			// Go ahead and grab them all, rather than testing exclusively for /^data-/ 
			// Since it just adds extra text to the overall script, without adding any 
			// benefit, nor instigating any problems.
			//
			// Since the data-attributes can be manually edited, for convenience you
			// can put \n in the body text (to prevent having actualy newlines in the HTML
			// so here we're converting \n back to email 7-bit representation.
			data[me.substr(5)] = me[i].value.replace(/\\n/g,"%0D%0A");
	
		}
	
		// Re-use the "atts" var (to reduce characters in final), 
		// and split "mailto" into seperate strings to prevent
		// bots from searching directly for "mailto:"
		atts = "ma" + "il" + "to" + ":";
		
		// Re-combine the user + domain as a normal email address.
		atts += data.u + "@" + data.d; 

		// Add subject only if exists
		atts += ( data.s ? "?subject=" + data.s : "" );

		// Add body only if exists (also, check if subject to use ? or &)
		atts += ( data.b ? (data.s ? "&" : "?" ) + "body=" + data.b : "" );

		document.location.href = atts;
	}
	
	
	
	
	// --------------------
	// Encoder Part
	// --------------------
	function getBits(str){
		// Find highest character code value
		var maxCo = 0;
		for(var i=0; i<str.length; i++){
			var co = str.charCodeAt(i);
			if(co > maxCo){
				maxCo = co;
			}
		}
		var bits = maxCo < 128 ? 12 : 16;
		return bits + Math.floor(Math.random() * (36 - bits));

	}

	function encode(str){
		var base = getBits(str);
		console.log(base);
		var Abase = base.toString().split("");
		var bin = Abase[0];
		for(var i=0; i<str.length; i++){
			/*
			var ch = str.charAt(i);
			var num = str.charCodeAt(i);
			var bit = convert(num, 10, base);
			bin += bit;
			*/

			bin += convert( str.charCodeAt(i), 10, base );

		}
		return bin + Abase[1];
	}


	// ------------------
	// Clean Text
	// ------------------
	// Escape ' and " 
	// Email requires newlines to use "%0D%0A" %0D = \r and %0A = \n
	// Which is quoted-printable representation of CrLf aka \r\n
	
	function cleanText(str){
		return str.replace(/'/g, "\\'")
						.replace(/'/g, "\\'")
						.replace(/"/g, '\\"')
						.replace(/\r\n/g, "__newline__")
						.replace(/\n/g, "__newline__")
						.replace(/\r/g, "__newline__")
						.replace(/__newline__/g, "%0D%0A");
	}

	function makeit(){
	
		var email = document.getElementById("email").value || "you@gmail.com";
		var subject = cleanText( document.getElementById("subject").value );
		var message = cleanText( document.getElementById("message").value );
		var label = cleanText( document.getElementById("label").value || "Contact" );
		var encrypt = document.getElementById("encrypt").checked;
	
		
		// Use onclick for a variety of reasons:
		// - Hard to get a handle to "this" <a> element
		// - Dealing with document.location.href is double trouble.
		var str = "";
		str += "<a";
		str += ' href="#"';
		str += ' title="' + label + '"';

		if(encrypt){

			str += " onclick='";

			str += '(function(s){';
			str += 'var b=s.slice(0,1)+""+s.slice(-1);';
			str += 's=s.slice(1,-1);';
			str += 'var o="";';
			str += 'for(var i=0;i<s.length;i+=2)';
			str += 'o+=String.fromCharCode(parseInt(s.substr(i,2),b).toString(10));';
			str += 'document.location.href=o;';
			str += '})("';
			str += encode("mailto:" + email + "?subject=" + subject + "&body=" + message);
			str += '")';

			str += "'";

		} else {

			var Aemail = email.split("@");
			str += ' data-u="' + Aemail[0] + '"';
			str += ' data-d="' + Aemail[1] + '"';
			str += ' data-s="' + cleanText(subject) + '"';
			str += ' data-b="' + cleanText(message) + '"';
			str += " onclick='";

			str += '(function(e){var d={};var a=e.attributes;for(var i=a.length;i--;){var b=a[i].name;';
			str += 'd[b.substr(5)]=a[i].value.replace(/\\n/g,"%0D%0A");';
			str += '}a="ma"+"il"+"to"+":"+d.u+"@"+d.d+(d.s?"?subject="+d.s:"")+(d.b?(d.s?"&":"?")+"body="+d.b:"");';
			str += 'document.location.href=a;})(this);';

			str += "'";

		}
		
		// Close <a> tag with label as innerHTML
		str += ">" + label + "</a>";

		el = document.getElementById("testLink").innerHTML = str;
		el = document.getElementById("code").innerHTML = str;


	}

	// ----------
	// Test
	// ----------
	// var encoded = encode("abc")
	// console.log( encoded, decode(encoded) );


gieson.MakeEmailLink = makeit;
})();

	






