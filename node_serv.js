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

net.createServer(function(sock) {
        
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    socks.push(sock);
    
    sock.on('data', function(data) {                        
        redisClient.select(3, function() {
            redisClient.get(data, function(err, value) {
                sock.write('{"id":'+data+', "value":'+value+'}');
                console.log('RedisDATA: '+value);
            });
        });
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
    });
  
    mqttClient.on('message', function(topic, message) {
        console.log('MESSAGE: ' + message);
        if (sock.write(message))
            console.log('Success: Payload sent to '+sock);
    }); 
    
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
        socks.splice(socks.indexOf(sock), 1);
    });                    
}).listen(PORT);


console.log('Server listening on ' + HOST +':'+ PORT);
