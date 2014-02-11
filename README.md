CEIT_Sensors_ServerCode
===================
By Craig Knott

This repository contains scripts to run on the server side to provide communication between Unity3D clients and the datastores.

The important files are: redis_republisher.py and node_serv.js

Redis Republisher
====
This script will connect to the MQTT server and republish all messages from the specified topics into a single topic to allow easy access by the node server.
This script will also store a copy of all the data in the redis database.
Run
===
run this in a screen to keep track of it.
  1. screen -S redis
  2. python2.7 redis_republisher.py
  3. control + a + d

Node Server
====
This program starts a node.js server which listens for connections from unity game clients and handles all the data requests, live pushes and any other communication implemented / required by the client.

Run
===
best to run this in a screen.
  1. screen -S sock
  2. node node_serv.js
  3. control + a + d


