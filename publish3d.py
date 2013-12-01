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
import json
import random

mqttc = None
            
def on_connect(mosq, obj, rc):
    if (rc == 0):
        print("Connected successfully")

def on_publish(mosq, obj, mid):
    print("Message " + str(mid) + " published")
    
def on_message(mosq, obj, msg):
    print("Message received on topic "+msg.topic+" with QoS "+str(msg.qos)+" and payload "+msg.payload)
    if msg.payload is not None:
        data = str(msg.payload)
        try:
            data2 = json.loads(data)
        except ValueError:
            print("Value Error loading data")
            return
        
        datastream = data2['id']
        value = data2['value']
        print datastream
        print value
        MQTT.packet['id'] = datastream
        MQTT.packet['value'] = str(value)
        data = json.dumps(MQTT.packet)
        mqttc.publish(MQTT.topic_3d, data)

def on_subscribe(mosq, obj, mid, qos_list):
    print("Subscribe with mid "+str(mid)+" received.")
    

def start_mosquitto(server, client_id, topic, username = None, password = None):
    global mqttc = mosquitto.Mosquitto(client_id)
    mqttc.connect(server, 1883, 60, True)
    mqttc.subscribe(MQTT.topic_temp)
    mqttc.on_connect = on_connect
    mqttc.on_subscribe = on_subscribe
    mqttc.on_message = on_message
    mqttc.on_publish = on_publish
    
    
if __name__ == '__main__':
    start_mosquitto(MQTT.server, MQTT.client_3d, MQTT.topic_temp)
    
