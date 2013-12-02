#################################################
#                                               #
#             sensor_config                     #
#          __author__ = craig knott             #
#################################################

import redis

r = redis.StrictRedis(host = 'winter.ceit.uq.edu.au', port = 6379, db = 2)

def add_sensor(endpt_id,pi_id):
    r.set(endpt_id, pi_id)
    print "Added " + endpt_id + " to " + pi_id

if __name__ == "__main__":
   while(1): 
        yn = raw_input("Would you like to add a sensor? (Y/N) ")
        if (yn == "N"):
            break
         if (yn != "Y"):
            continue        
        pi_id = raw_input("Enter the ID of the PI you wish to add a sensor to? (eg: 401) ")
        while(1):
            endpt = raw_input("Enter the endpoint ID of the sensor you wish to add: ")
            add_sensor(endpt, pi_id)
            yn = raw_input("Would you like to add another sensor to " + pi_id + "? ")
            if (yn == "Y"):
                continue
            break

