#!/usr/bin/env bash

# download enron corpus and unpack
downloadAndExtract() {
  local ENRON_DATA_ZIP="enron_mongo.tar.bz2"

  if [ ! -f /tmp/foo.txt ]; then
    echo "Dowloading $ENRON_DATA_ZIP..."
    curl https://s3.amazonaws.com/mongodb-enron-email/$ENRON_DATA_ZIP --remote-name --progress
  fi

  echo "Extracting mongo backup from $ENRON_DATA_ZIP"
  tar -xvf $ENRON_DATA_ZIP
}


run() {
  local DB=__fakeenron

  downloadAndExtract

  # extract to mongodb
  echo "Importing data to mongodb"
  mongo $DB --eval 'db.messages.remove({})'
  mongorestore --collection messages -d $DB ./dump/enron_mail/messages.bson

  # python enron.py
}


run
