#!/usr/bin/env bash

downloadAndExtract() {
  local ENRON_DATA_ZIP="enron_mongo.tar.bz2"

  if [ ! -f /tmp/foo.txt ]; then
    echo "Dowloading $ENRON_DATA_ZIP..."
    curl https://s3.amazonaws.com/mongodb-enron-email/$ENRON_DATA_ZIP --remote-name --progress
  fi

  echo "Extracting mongo backup from $ENRON_DATA_ZIP"
  tar -xvf $ENRON_DATA_ZIP
}

downloadAndExtract
