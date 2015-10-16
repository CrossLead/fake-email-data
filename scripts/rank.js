var EventRank   = require('gak').EventRank;
var ProgressBar = require('progress');
var _           = require('lodash');
var d3          = require('d3');
var moment      = require('moment');

var maxYear = new Date('2001');
var n = 250;
var oneDay = 24 * 60 * 60;

console.log('Loading enron emails...');
var emails = require('./mongo-enron.json').filter(function(e) {
  return moment(e.time*1000) < maxYear;
});

console.log('Getting correspondent set...');

var correspondents = require('./correspondents.json');

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

console.log('Getting top ' + n + ' ranks...');
console.log(_.map(R.top(n), function(v) { return v.id; }));
