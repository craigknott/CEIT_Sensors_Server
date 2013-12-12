import mosquitto
import json
import httplib
import urllib

senIDS = {
        '34.11.0':  23105,
        '31.11.0':  23106,
        '31.12.0':  23107,
        '18.11.0':  23109,
        '18.12.0':  23111,
        '13.11.0':  23110,
        '13.12.0':  24613,
        '15.11.0':  24614,
        '15.12.0':  24615,
        '23.11.0':  24616,
        '23.12.0':  24619,
        '19.11.0':  24620
        }

tsIDS = {
        '34.11.0' : 'field1',  
        '34.12.0' : 'field2',
        '255.12.0' : 'field3',
        '18.12.0' : 'field4',
        '18.11.0' : 'field5',
        '27.11.0' : 'field6',
        '27.12.0' : 'field7',
        '13.12.0' : 'field8'
        }

class OpenSense:
    """
    open.sen.se static data
    """
    # List of feed id's
    feed_ids = {}


class OpenSensePacket:
    """
    Generic open.sen.se packet class
    """
    def push(self):
        """
        Push values to open.sen.se
        
        @return response from open.sen.se
        """
        headers = {"Content-type": "application/json", "sense_key": self.sense_key}
        url = "api.sen.se"
        res = None

        try:
            conn = httplib.HTTPConnection(url, timeout=8)
            conn.request('POST', "/events/", json.dumps(self.events), headers)
            response = conn.getresponse()
            res = response.reason
        except:
            pass
        
        conn.close()

        return res


    def __init__(self, sense_key, endpoints):
        """
        Constructor
        
        @param sense_key: open.sen.se authentication key
        @param endpoints: list of (feed_ID, value) pairs
        """
        # Sense key
        self.sense_key = sense_key

        self.events = []
        for endp in endpoints:
            event = {"feed_id": endp[0], "value": endp[1]}
            self.events.append(event)

class ThingSpeakPacket:
    """
    Generic ThingSpeak packet class
    """
    def push(self):
        """
        Push values to ThingSpeak
        
        @return response from ThingSpeak
        """
        headers = {"Content-type": "application/x-www-form-urlencoded","Accept": "text/plain"}
        url = "winter.ceit.uq.edu.au:3000"
        res = None
        
        try:
            conn = httplib.HTTPConnection(url, timeout=5)
            conn.request("POST", "/update", self.params, headers)       
            response = conn.getresponse()
            res = response.reason
        except:
            pass
        
        conn.close()

        return res


    def __init__(self, api_key, endpoints):
        """
        Constructor
        
        @param api_key: ThingSpeak write API key
        @param endpoints: list of (field ID, value) pairs
        """
        params_dict = {'key': api_key}
        
        for endp in endpoints:
            params_dict[endp[0]] = endp[1]
        
        # Parameters
        self.params = urllib.urlencode(params_dict)

class mqttStart():
    """
    class to handle packet checking
    """
    def on_connect(self, mosq, obj, rc):
        if (rc==0):
            print ("Connected Successfully")

    def on_publish(self, mosq, obj, mid):
        print ("Published: " + str(mid))

    def on_message(self, mosq, obj, msg):
        """
        Message recieved handle accordingly
        """
        if msg.payload is not None:
            data = str(msg.payload)
            try:
                data2 = json.loads(data)
            except ValueError:
                print ("Value Error loading data")
                return
            if data2['id'] in senIDS:
                senID = senIDS[data2['id']]
                packet = OpenSensePacket('erJRoQ7XtQ6KCFoUR4f1rA', [(senID, data2['value'])])
                print "OpenSense: ", packet.push()

            if data2['id'] in tsIDS:
                tsID = tsIDS[data2['id']]
                packet = ThingSpeakPacket('DTBJ7M328632WMKM', [(tsID, data2['value'])])
                print "ThingSpeak: ", packet.push()


    def on_subscribe(self, mosq, obj, mid, qos_list):
        print("Subscribed with " + str(mid))

    def printSet(self):
        print ""
        print "Current DataSet"
        print ""
        print self.idSet
        with open('data.txt', 'w') as outfile:
            json.dump(self.idSet, outfile)

    def __init__(self, client_ID, host, topic):
        self.idSet = {}
        self.mqttc = mosquitto.Mosquitto(client_ID)
        self.mqttc.on_connect = self.on_connect
        self.mqttc.on_publish = self.on_publish
        self.mqttc.on_message = self.on_message
        self.mqttc.on_subscribe = self.on_subscribe
        self.mqttc.connect(host, 1883, 60)
        self.mqttc.subscribe(topic)
        self.mqttc.loop_start()


if __name__ == "__main__":
    mqttStart('OpenSense', 'winter.ceit.uq.edu.au', '/LIB/3d/data')
    print "Asynchronous loop started"
    while True:
        continue
