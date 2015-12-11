var EventRank   = require('gak').EventRank,
    ProgressBar = require('progress'),
    _           = require('lodash'),
    d3          = require('d3'),
    moment      = require('moment'),
    pmongo      = require('promised-mongo'),
    fs          = require('fs'),
    program     = require('commander'),
    done        = process.exit.bind(process, 0);


program
  .version('0.0.1')
  .option('-r, --replace-emails <file>', '(required) Json file containing emails to subsitute')
  .option('-e, --enron-emails <file>', 'Json file of enron emails to rank', './correspondents.json')
  .option('-d, --database <string>', 'Mongodb of emails', '__fakeenron')
  .option('-y, --max-year <number>', 'Maximum year to include', 2001)
  .parse(process.argv);


if (!program.replaceEmails) {
  console.log('Error: No replacement emails given!');
  program.help();
  done();
}

var replacements = require(program.replaceEmails)


var db = pmongo(program.database),
    messages = db.collection('messages'),
    replaced = db.collection('replaced');


replaced
  .remove({})
  .then(clean)
  .then(rank)
  .then(replace)
  .then(done)
  .catch(logError);


function logError(error) {
  console.log(error.stack);
}


function getSet(message, key) {
  return _(message.headers[key] || '')
    .split(',')
    .map(function(x) { return x.trim() })
    .unique()
    .value();
}


function clean() {

  return messages
    .find()
    .count()
    .then(function (total) {
      var bar = new ProgressBar('Cleaning data... [:bar] :percent :etas', { total: total, width: 80 }),
          data = [];

      return messages
        .find({})
        .forEach(function(m) {
          data.push({
            time: moment(new Date(m.headers.Date)).unix(),
            from: m.headers.From,
            to: _([])
              .concat(getSet(m, 'To'))
              .concat(getSet(m, 'Bcc'))
              .concat(getSet(m, 'Cc'))
              .compact()
              .unique()
              .value()
          });
          bar.tick();
        })
        .then(function () {
          return data;
        })
        .catch(function(error) {
          console.log(error.stack);
        });
    });
}


function rank(data) {
  var correspondents = require(program.enronEmails);
  var maxYear = new Date(program.maxYear.toString());
  var n = replacements.length;
  var oneDay = 24 * 60 * 60;

  var emails = _(data)
    .filter(function(e) {
      return moment(e.time*1000) < maxYear;
    })
    .sortBy('time')
    .value()

  var R = new EventRank({
    correspondents: correspondents,
    g: oneDay,
    h: oneDay,
    model:'reply'
  });

  var bar = new ProgressBar('Stepping... [:bar] :percent :etas', { total: emails.length, width: 80 });

  for (var i = 0, l = emails.length; i < l; i++) {
    var email = emails[i];
    if (email.to && email.to.length) {
      R.step(email);
    }
    bar.tick();
  }

  var catchUpBar = new ProgressBar('Catching up... [:bar] :percent :etas', { total: correspondents.length, width: 80 });

  for (var i=0, l=correspondents.length; i < l; i++) {
    R.catchUp(correspondents[i]);
    catchUpBar.tick();
  }

  return R.top(n)
}


function replace(top) {
  var l = replacements.length;

  if (l > top.length) {
    console.log('Error: More replacement emails than top ranks computed!');
    program.help();
    done();
  }

  var replaceFunctions = top.map(function (r, index) {
    var rx = new RegExp(_.escapeRegExp(r.id), 'gi');
    return function(message, header) {
      message.headers[header] = (
        message.headers[header] &&
        message.headers[header].replace(rx, replacements[index])
      );
      return message;
    };
  });


  return messages
    .find()
    .count()
    .then(function (total) {
      var bar = new ProgressBar('Replacing email addressess... [:bar] :percent :etas', { total: total, width: 80 }),
          replacedEmails = [];

      return messages
        .find({})
        .forEachAsync(function (message) {
          bar.tick();

          replaceFunctions.forEach(function (fn, i) {
            fn(message, 'From');
            fn(message, 'To');
            fn(message, 'Bcc');
            fn(message, 'Cc');
          })

          return replaced.insert(message);
        });
    })
}
