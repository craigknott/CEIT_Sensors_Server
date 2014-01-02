//REQUIRES
var net = require('net');
var mqtt = require('mqtt');
var redis = require('redis');

//CONFIG
var HOST = 'talmeeno.com';
var PORT = 6969;
var mqttClient = new mqtt.createClient(1883, 'winter.ceit.uq.edu.au', {keepalive: 10000});
var topic = '/LIB/3d/data';
var socks = [];

mqttClient.subscribe(topic);
redisClient = redis.createClient(6379, 'winter.ceit.uq.edu.au');


redisClient.on('error', function(err) {
    console.log('Redis ERROR: ' + err);
});

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
serv = net.createServer(function(sock) {
    var remoteAddress = sock.remoteAddress;
    var remotePort = sock.remotePort;    
  
    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED: ' + remoteAddress +':'+ remotePort);
    socks.push(sock);
    
    // Add a 'data' event handler to this instance of socket            
    sock.on('data', function(data) {
        redisClient.select(3, function() {
            redisClient.get(data, function(err, value) {
                sock.write('{"id":'+data+', "value":'+value+'}');
                console.log('RedisDATA: '+value);
            });
        });
        console.log('DATA ' + remoteAddress + ': ' + data);
    });
  
    mqttClient.on('message', function(topic, message) {
        try {
            if (socks.indexOf(sock) != -1)
            {           
                if (sock.write(message))
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


