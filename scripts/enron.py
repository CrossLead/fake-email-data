#
# Script to generate json of email events for testing from enron email corpus.
# To reproduce, download the mongoDb dump from
# http://mongodb-enron-email.s3-website-us-east-1.amazonaws.com/
# and export the messages collection to a csv
#
import json
import time
from pymongo import MongoClient
from dateutil.parser import parse

# Prep emails for use in gak.EventRank
def mongoClean(collection='messages'):
  client = MongoClient()
  db = client['__fakeenron']
  out = []
  count = 0
  total = float(db[collection].count())
  with open('./mongo-enron.json', 'w') as outjson:
    for message in db[collection].find():
      count += 1
      if (count < 10):
        print(message['headers']['Date'])
        print(parse(message['headers']['Date']).timetuple())
        print(time.mktime(parse(message['headers']['Date']).timetuple()))
      if (count % 1000) == 0:
        workdone = count / total
        print("\rProgress: [{0:50s}] {1:.1f}%".format('#' * int(workdone * 50), workdone*100), end="", flush=True)

      getSet = lambda k : set(x.strip() for x in message['headers'][k].split(',')) if k in message['headers'] else set()
      record = {
        "to" : [x for x in (getSet('To') | getSet('Bcc') | getSet('Cc')) if x],
        "from" : message['headers']['From'],
        "time" : time.mktime(parse(message['headers']['Date']).timetuple())
      }
      out.append(record)

    json.dump(sorted(out, key=lambda x: x['time']), outjson)


if __name__ == '__main__':
  mongoClean()
