"use strict";
var WebSocket = require('ws');
var Socks = require('socks');
var SocksProxyAgent = require('socks-proxy-agent');
var HttpsProxyAgent = require('https-proxy-agent');
var colors = require('colors');
var asciiArt = require('ascii-art');
var bots = [];
var port = 8080;
var io = require('socket.io')(port);
var fs = require('fs');
var proxies = fs.readFileSync("proxies.txt", "utf8").split("\n").filter(function(a) {
	return !!a;
});
var Proxies = fs.readFileSync("httpProxy.txt", "utf8").split("\n").filter(function(a) {
	return !!a;
});
var server = "";
var origin = null;
var xPos, yPos, byteLength = 0;
var connectedCount = 0;
var botCount = 2000;
var client = null;
var users = 0;
var sendCountUpdate = function() {};
var spawnBuf = new Uint8Array([115,10,1,15,32,42,78,101,119,42,77,101,77,101,122,66,111,116,115]);
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomIntCharAt(min, max) {
	return (Math.floor(Math.random() * (max - min + 1)) + min).charCodeAt;
}

function appendStringBytes(string, buf) {
	for (var i = 0; i < string.length; i++) {
		buf[3 + i] = string.charCodeAt[i];
	}
	return buf;
}

function getHost(a) {
	a = a.replace(/[/slither]/g, '');
	a = a.replace(/[ws]/g, '');
	a = a.replace(/[/]/g, '');
	a = a.substr(1);
	//console.log(a);
	return a;

}

function prepareData(a) {
	return new DataView(new ArrayBuffer(a));
}

function createAgent(b) {
	var proxy = b.split(':');
	return new Socks.Agent({
		proxy: {
			ipaddress: proxy[0],
			port: parseInt(proxy[1]),
			type: parseInt(proxy[2]) || 5
		}
	});
}

//var proxies = [~~(Math.random() * proxies.length)];


function createHttpAgent(b) {
	var proxy = b.split(':');
	return new HttpsProxyAgent("http://" + proxy[0] + ":" + proxy[1]);
}

function Bot(id) {
	this.id = id;
	this.connect();
}

Bot.prototype = {
	needPing: false,
	snakeID: null,
	snakeX: 0,
	snakeY: 0,
	headX: 0,
	headY: 0,
	snakeAngle: 0,
	haveSnakeID: false,
	isBoost: false,
	hasConnected: false,
	send: function(buf) {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
			return;
		this.ws.send(buf);
	},
	connect: function() {
		if (Math.random() >= 0.5) {
			this.ws = new WebSocket(server, {
				headers: {
					'Origin': origin,
					'Accept-Encoding': 'gzip, deflate',
					'Accept-Language': 'en-US,en;q=0.8',
					'Cache-Control': 'no-cache',
					'Connection': 'Upgrade',
					'Host': getHost(server), //104.207.132.60:4041
					'Pragma': 'no-cache',
					'Upgrade': 'websocket',
					'Sec-WebSocket-Version': '13',
					'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
					'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36'
				},
				agent: createAgent(proxies[~~(Math.random() * proxies.length)])
			});
		} else {
			this.ws = new WebSocket(server, {
				headers: {
					'Origin': origin,
					'Accept-Encoding': 'gzip, deflate',
					'Accept-Language': 'en-US,en;q=0.8',
					'Cache-Control': 'no-cache',
					'Connection': 'Upgrade',
					'Host': getHost(server), //104.207.132.60:4041
					'Pragma': 'no-cache',
					'Upgrade': 'websocket',
					'Sec-WebSocket-Version': '13',
					'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
					'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36'
				},
				agent: createHttpAgent(Proxies[~~(Math.random() * Proxies.length)])
			});
		}




		this.binaryType = "nodebuffer";
		this.ws.onmessage = this.onMessage.bind(this);

		this.ws.onopen = this.onOpen.bind(this);
		this.ws.onclose = this.onClose.bind(this);
		this.ws.onerror = this.onError.bind(this);
	},
	spawn: function() {
    this.send(spawnBuf); //new Buffer([115, 9, getRandomInt(0, 38), 9,77,101,77,101,122, ])
	},
	moveTo: function(x, y) {
		//var randomInt = getRandomInt(-25, 25);
		var value = this.getValue(this.snakeX, this.snakeY, x, y);
		this.snakeAngle = value;
		if (value < 0 || value > 250) {
			console.log("Error!");
		}
		//

		//console.log("x "+this.snakeX+" y "+this.snakeY + " v "+Math.ceil(value));
		//var buf = new Buffer(value * 251 / (2*Math.PI));
		var buf = new Buffer([Math.floor(value)]);
		this.send(buf);
	},
	getValue: function(originX, originY, targetX, targetY) {
		var dx = originX - targetX;
		var dy = originY - targetY;

		// var theta = Math.atan2(dy, dx);  // [0, Ⲡ] then [-Ⲡ, 0]; clockwise; 0° = west
		// theta *= 180 / Math.PI;          // [0, 180] then [-180, 0]; clockwise; 0° = west
		// if (theta < 0) theta += 360;     // [0, 360]; clockwise; 0° = west

		// var theta = Math.atan2(-dy, dx); // [0, Ⲡ] then [-Ⲡ, 0]; anticlockwise; 0° = west
		// theta *= 180 / Math.PI;          // [0, 180] then [-180, 0]; anticlockwise; 0° = west
		// if (theta < 0) theta += 360;     // [0, 360]; anticlockwise; 0° = west

		// var theta = Math.atan2(dy, -dx); // [0, Ⲡ] then [-Ⲡ, 0]; anticlockwise; 0° = east
		// theta *= 180 / Math.PI;          // [0, 180] then [-180, 0]; anticlockwise; 0° = east
		// if (theta < 0) theta += 360;     // [0, 360]; anticlockwise; 0° = east

		//var theta = Math.atan2(-dy, -dx); // [0, Ⲡ] then [-Ⲡ, 0]; clockwise; 0° = east
		var theta = Math.atan2(-dy, -dx);
		//if(theta < 0) {theta += 2*Math.PI}
		theta *= 125 / Math.PI; // [0, 180] then [-180, 0]; clockwise; 0° = east
		if (theta < 0) theta += 250; // [0, 360]; clockwise; 0° = east

		return theta
	},
	onOpen: function(b) {
		//if(connectedCount > botCount)
		//    this.disconnect();
		client = this;
		//console.log('Connecting...');
		this.send(new Buffer([99]));
		this.hasConnected = true;
		connectedCount++;
		sendCountUpdate();
	},
	onClose: function() {
		client = this;
		this.needPing = false;
		this.haveSnakeID = false;
		if (this.hasConnected) {
			connectedCount--;
			sendCountUpdate();
			//this.ws.close();
			//this.disconnect();
		}
		setTimeout(function() {
			//client.connect();
		}, 500);

	},
	onError: function(e) {
		this.needPing = false;
		//clearInterval(this.ping());
		//console.log(e);
		setTimeout(function() {
				//console.log('Retrying... (500ms)');
				this.connect.bind();
			}
			.bind(this), 5);
	},
	decodeSecrect: function(secret) {
		var result = new Uint8Array(24);
		var globalValue = 0;
		for (var i = 0; i < 24; i++) {
			var value1 = secret[17 + i * 2];
			if (value1 <= 96) {
				value1 += 32;
			}
			value1 = (value1 - 98 - i * 34) % 26;
			if (value1 < 0) {
				value1 += 26;
			}

			var value2 = secret[18 + i * 2];
			if (value2 <= 96) {
				value2 += 32;
			}
			value2 = (value2 - 115 - i * 34) % 26;
			if (value2 < 0) {
				value2 += 26;
			}

			var interimResult = (value1 << 4) | value2;
			var offset = interimResult >= 97 ? 97 : 65;
			interimResult -= offset;
			if (i == 0) {
				globalValue = 2 + interimResult;
			}
			result[i] = ((interimResult + globalValue) % 26 + offset);
			globalValue += 3 + interimResult;
		}

		return result;

	},
	boostSpeed: function(a) {
		client = this;
		if (a) {
			//setTimeout(function() {
			this.isBoost = true;
			client.send(new Buffer([253]));
			//}, getRandomInt(500, 1000));
		} else {
			//setTimeout(function() {
			this.isBoost = false;
			client.send(new Buffer([254]));
			//}, getRandomInt(500, 1000));
		}
	},
	disconnect: function() {
		//console.log(`${this.id} disconnect`);
		if (this.ws) this.ws.close();
		this.haveSnakeID = false;
	},
	onMessage: function(b) {
		client = this;
		var lol = new Uint8Array(b.data);
		var f = String.fromCharCode(lol[2]);
		var snakeSpeed, lastPacket, etm;
		//console.log(b);
		if (2 <= lol.length) {
			if ("6" == f) {
				var client = this;
				console.log("PerInitRespone");
				var e = 165;
				var c = 3;
				var h = "";
				for (h = ""; c < e;) {
					h += String.fromCharCode(lol[c]),
						c++;
				}
				this.send(this.decodeSecrect(lol));
				this.spawn();
			} else if ("p" == f) {
				var client = this;
				this.needPing = true;
			} else if ("a" == f) {
				console.log("Initial setup");
				setInterval(function() {
					client.moveTo(xPos, yPos);
				}, 100);
				setInterval(function() {
					//if(client.needPing){
					client.send(new Buffer([251]));
					//}
				}, 250);
			} else if ("v" == f) {
				console.log("dead");
				this.haveSnakeID = false;
				this.disconnect();
				//this.disconnect();
			} else if ("g" == f) {
				//this.updatePos(lol, "g");

				if ((lol[3] << 8 | lol[4]) == this.snakeID) {
					this.snakeX = lol[5] << 8 | lol[6];
					this.snakeY = lol[7] << 8 | lol[8];
				}
			} else if ("n" == f) {
				//this.updatePos(lol, "n");

				if ((lol[3] << 8 | lol[4]) == this.snakeID) {
					this.snakeX = lol[5] << 8 | lol[6];
					this.snakeY = lol[7] << 8 | lol[8];
				}
			} else if ("G" == f) {
				//this.updatePos(lol, "G");

				if ((lol[3] << 8 | lol[4]) == this.snakeID) {
					this.snakeX = this.snakeX + lol[5] - 128;
					this.snakeY = this.snakeY + lol[6] - 128;
				}
			} else if ("N" == f) {
				//this.updatePos(lol, "N");
				if ((lol[3] << 8 | lol[4]) == this.snakeID) {
					this.snakeX = this.snakeX + lol[5] - 128;
					this.snakeY = this.snakeY + lol[6] - 128;
				}

			} else if ("s" == f) {
				if (!this.haveSnakeID) {
					this.snakeID = lol[3] << 8 | lol[4];
					this.haveSnakeID = true;
				}
				if ((lol[3] << 8 | lol[4]) == this.snakeID) {
					if (lol.length >= 31) {
						snakeSpeed = (lol[12] << 8 | lol[13]) / 1e3;

					}
					if (lol.length >= 31 && (((((lol[18] << 16) | (lol[19] << 8) | lol[20]) / 5.0) > 99) || ((((lol[21] << 16) | (lol[22] << 8) | lol[23]) / 5.0) > 99))) {
						this.snakeX = ((lol[18] << 16) | (lol[19] << 8) | lol[20]) / 5.0;
						this.snakeY = ((lol[21] << 16) | (lol[22] << 8) | lol[23]) / 5.0;
					}
				}

			} else if ("g" || "n" || "G" || "N" && (lol[3] << 8 | lol[4]) === this.snakeID) {

				if (lastPacket != null) {
					var deltaTime = Date.now() - lastPacket;


					var distance = snakeSpeed * deltaTime / 4.0;
					this.snakeX += Math.cos(this.snakeAngle) * distance;
					this.snakeY += Math.sin(this.snakeAngle) * distance;
				}
				lastPacket = Date.now();

			}
		}


	}

};

function start() {
	for (var i in bots)
		bots[i].disconnect();
	//for (var i = Object.keys(bots); i < botCount; i++)
	//        bots.push(new Bot(proxies.length));
	//for(var i = 0; i < proxies.length; i++)
	//    bots.push(new Bot(i));
	var i = 0;
	/*setInterval(function() {
	i++;
	bots.push(new Bot(i));
	},200);*/
	var i = 0;
	setInterval(function() {
		i++;
		bots.push(new Bot(i));
	}, 5);
	for (var i in bots)
		bots[i].connect();
}

//var UserIp = "127.0.0.1";

io.on('connection', function(socket) {
	users++;
  var address = socket.request.connection.remoteAddress;
	console.log('Users Connected with address: '+address);
	sendCountUpdate = function() {

		socket.emit("botCount", connectedCount);
	};
	socket.on('start', function(data) {
		server = data.ip;
		origin = data.origin;
		start();
		console.log('ServerIp: ' + server);
		console.log('Origin: ' + origin);
		console.log('Bots will start DDOSing Now! :)');
	});
	socket.on('movement', function(data) {
		xPos = data.x;
		yPos = data.y;
		var i = botCount;
	});
	socket.on('boostSpeed', function() {
		var i = 0;
		for (var i in bots) {
			bots[i].boostSpeed(true);
		}
	});
	socket.on('normalSpeed', function() {
		for (var i in bots) {
			bots[i].boostSpeed(false);
		}
	});

});
asciiArt.font('MeMezBots-Dev-SlitherIo', 'Doom', function(rendered){
    console.log(rendered);
    console.log("Server is now listening on: " + port);
});

//console.log(('INFO:' + 'If a bot will crash and get error it will retry to connect again in 500ms(miliseconds)').green);
//server = "ws://209.58.183.136:444/slither";
//origin = "http://slither.io/";
//start();