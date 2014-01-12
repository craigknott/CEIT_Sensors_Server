################################################################
__author__="Craig Knott"
__date__="02/12/2013"
################################################################
#This program receives data from MQTT and publishes the data onto
#the 3D models MQTT topic

import sys
import time
from MQTT import MQTT

import mosquitto
import redis
import json
import random


class pub3d():            
    def on_connect(self, mosq, obj, rc):
        if (rc == 0):
            print("Connected successfully")
            self.mqttc.subscribe(MQTT.topic_temp)
            self.mqttc.subscribe("gumballrfid")
            self.mqttc.subscribe("LIB/rfid/doorSouth")
            self.mqttc.subscribe("/MarksPlant/data")
    
    def on_publish(self, mosq, obj, mid):
        print("Message " + str(mid) + " published")
        
    def on_message(self, mosq, obj, msg):
        print("Message received on topic "+msg.topic+" with QoS "+str(msg.qos)+" and payload "+msg.payload)
        if msg.payload is not None:
            data = str(msg.payload)
            try:
                data2 = json.loads(data)
            except ValueError:
                print("Value Error loading data")
                return
            if (msg.topic == "/MarksPlant/data"):
                datastream = "1.0.0"
                value = str(msg.payload)
            elif (msg.topic == "LIB/rfid/doorSouth"):
                datastream = data2['IPaddress']
                value = data2['cardCode']
            else:
                datastream = data2['id']
                value = data2['value']		        
                try:
                    if (data2['name'] == "PIR" and data2['value'] == "1.0"):
                        print "PIR = 1.0 returning"
                        return
                except:
                    print "oops, got an error."
            print datastream
            print value
            MQTT.packet['id'] = datastream
            MQTT.packet['value'] = str(value)
            MQTT.packet['timestamp'] = int(time.time())
#            data = json.dumps(MQTT.packet)
#            self.mqttc.publish(MQTT.topic_3d, data)
            try:
                self.redisDB.zadd(str(datastream), int(time.time()), str(value))
                print "Successfull zadd " + datastream
            except:
                print "Redis connection error"
                raise
    
    def on_subscribe(self, mosq, obj, mid, qos_list):
        print("Subscribe with mid "+str(mid)+" received.")
        
    
    def start_mosquitto(self, server, client_id, topic, username = None, password = None):
        self.mqttc = mosquitto.Mosquitto(client_id)
        self.mqttc.on_connect = self.on_connect
        self.mqttc.on_subscribe = self.on_subscribe
        self.mqttc.on_message = self.on_message
        self.mqttc.on_publish = self.on_publish
        self.mqttc.connect(server, 1883, 60, True)
    	self.mqttc.loop_forever()
        
    def __init__(self):
        self.redisDB = redis.StrictRedis()
        self.start_mosquitto(MQTT.server, 'REDIS TESTING CLIENT', MQTT.topic_temp)
        
if __name__ == '__main__':
    pub3d().__init__()

