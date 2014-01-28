//REQUIRES
var net = require('net');
var mqtt = require('mqtt');
var redis = require('redis');

//CONFIG
var HOST = '127.0.0.1';
var PORT = 3001;
var mqttClient = new mqtt.createClient(1883, '127.0.0.1');
var topic = '/LIB/3d/data';
var socks = [];

mqttClient.on('connect', function() {
    console.log('mqtt connected');
    mqttClient.subscribe(topic);
});
//redisClient = redis.createClient(6379, 'winter.ceit.uq.edu.au');
redisClient = redis.createClient();

redisClient.on('error', function(err) {
    console.log('Redis ERROR: ' + err);
});

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
serv = net.createServer(function(sock) {
    var remoteAddress = sock.remoteAddress;
    var remotePort = sock.remotePort;    
    var keys;  
    var delay = 0;
    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED: ' + remoteAddress +':'+ remotePort);
    
    function update_keys(keys, time, callback) {
        redisClient.select(3, function(err, value) {
            for_loop(0, keys.length, keys, time, function(keys) {
                console.log(keys);
                callback(keys);
            });
        });
    }

    function for_loop(i, length, keys, time, callback) {
        if (i < length) {
            console.log(keys[i]);
            update_key(keys[i], time, function(key) {
                keys[i] = key;   
                if (i+1 < length) {
                    for_loop(i+1, length, keys, time, callback)
                } else {
                    console.log('calling back keys');
                    callback(keys);
                }
            });
        }
    }    

    function update_key(key, time, callback) {    
            try {
                var arg1 = [key['id'], 0, time];
                console.log(arg1);
            } catch (err) {
                console.log('ERROR: ' + err.number + "; " + err);
            }
            redisClient.zrangebyscore(arg1, function(err, value) {
                try {
                    key['value'] = JSON.parse(value[value.length - 1])['value'];
                } catch (err) {
                    console.log('ERROR: ' + err.number + "; " + err);
                }
                console.log('calling back from update_key');
                callback(key);
            });
    }
	
    var datastore = "";
    // Add a 'data' event handler to this instance of socket            
    sock.on('data', function(data) {
//	try {
	    datastore += data;
	    if (datastore.indexOf('\0') != -1) { 
		var tmp = JSON.parse(datastore.substr(0, datastore.indexOf('\0')));
		if (datastore.indexOf('\0') == datastore.length)
		    datastore = "";
		else
		    datastore = datastore.substr(datastore.indexOf('\0') + 1);
	    } else {
		return;
	    }
//        } catch (err) {
//	    console.log("errorrrr");
//	    return;
//	}
	//The latest values.
        if (tmp['data'] == 'init') {
            keys = update_keys(tmp['ids'], tmp['timestamp'], function(keys) {
                console.log("stringified" + JSON.stringify(keys));
                sock.write(JSON.stringify(keys)+'\0');
                socks.push(sock);
                delay = 0;
            });
        } else if (tmp['data'] == '1') {
            //Gotta start tracking the time specified at the pace specified and pushing data to
            //the client as it is needed.
            keys = update_keys(tmp['ids'], tmp['timestamp'], function(keys) {
                sock.write(JSON.stringify(keys)+'\0');
                if (delay == 0) {
                    socks.splice(socks.indexOf(sock), 1);
                    delay = 1;
                }
            });
        }

        //The first time the client connects it will send init data requesting
       // console.log('DATA ' + remoteAddress + ': ' + data);
    });
  
    mqttClient.on('message', function(topic, message) {
        try {
            if (socks.indexOf(sock) != -1)
            {           
                if (sock.write('['+message+']\0'))
                {
                    console.log('MESSAGE: ' + message);
                    console.log('Success: Payload sent to '+remoteAddress+ ':' + remotePort);
                }
            }
        } catch (err) {
            console.log('ERROR: ' + err.number + "; " + err);
        }
    }); 
    
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED: ' + remoteAddress +':'+ remotePort);
        socks.splice(socks.indexOf(sock), 1);
        sock.destroy();
        if (socks.length == 0) {
            
        }
    }); 

    sock.on('timeout', function(data) {
        console.log('TIMOUT: ' + remoteAddress +':'+ remotePort);
        socks.splice(socks.indexOf(sock), 1);
        sock.end();
    });    

    sock.on('error', function(err) {
        console.log('ERROR: ' + err);
    });
})
console.log('Server listening on ' + HOST +':'+ PORT);

serv.listen(PORT);


