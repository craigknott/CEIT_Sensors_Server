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

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net.createServer(function(sock) {
        
    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    socks.push(sock);
  //  if (socks.length > 1) {
  //      mqttClient.subscribe(topic);
  //  }
    // Add a 'data' event handler to this instance of socket            
    sock.on('data', function(data) {                        
        redisClient.select(3, function() {
            redisClient.get(data, function(err, value) {
                sock.write('{"id":'+data+', "value":'+value+'}');
                console.log('RedisDATA: '+value);
            });
        });
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
        // Write the data back to the socket, the client will receive it as data from the server
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
   //     if (socks.length < 1) {
   //         mqttClient.unsubscribe(topic);
   //     }
    });                    
}).listen(PORT);


console.log('Server listening on ' + HOST +':'+ PORT);

/*mqttClient.addListener('mqttData', function(topic, payload) {
    console.log('mqttDATA RECIEVED ' + payload);    
    //Send payload to unity
    console.log('SOCKS: ' + socks); 
    socks.forEach(function (sock) {
        if (sock.write(payload))
            console.log('Success: Payload sent to ' + sock);
        else
            console.log('Failure: Payload failed to send to ' + sock);
    });
});
*/
