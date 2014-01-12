import redis, time

rdb = redis.StrictRedis()

keys = rdb.keys()
t = []

for key in keys:
    zr = rdb.zrange(key, -1, -1, withscores='True')
    try:
        t.append((key,int((time.time() - zr[0][1])/60), zr[0][0]))
    except ():
        print "some error"

for p in t:
    if (p[1] > 16):
        print p
