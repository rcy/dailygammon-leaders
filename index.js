"use strict";

const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const assert = require('assert');
const insertRecord = require('./graphql.js').insertRecord;
const queue = require('queue');

const scrape = (login, password, count, handler, done) => {
  const r = request.defaults({ jar: true })

  r.post('http://www.dailygammon.com/bg/login/', {
    form: { login, password },
  }, (error, response, html) => {
    if (error) {
      throw error;
    }

    const $ = cheerio.load(html);

    assert.equal($('h2').text(), `Welcome to DailyGammon, ${login}.`);

    r(`http://www.dailygammon.com/bg/plist?type=rate&length=${count||10}`,
      (error, response, html) => {
        if (error) {
          throw error;
        }

        const $ = cheerio.load(html);

        assert.equal($('tr[align=center]').children('th').text(),
                     '#PlayerRatingExperience\n');

        const rows = $('table').slice(1).eq(0).children('tr').slice(1);

        rows.each((i, r) => {
          const cols = $(r).children();

          const rank = +cols.eq(1).text();
          const userId = +cols.eq(3).children('a').attr('href').split('/')[3];
          const username = cols.eq(3).text();
          const rating = +cols.eq(4).text();
          const experience = +cols.eq(6).text();

          handler && handler({ userId, username, rank, rating, experience });
        });

        done && done();
      });
  });
}

const login = process.env.USERNAME;
const password = process.env.PASSWORD;

assert(login, '$USERNAME not set');
assert(password, '$PASSWORD not set');

const jobs = [];

var count = 0;

scrape(login, password, 10000,
       function (rec) {
         jobs.push(function (cb) {
           console.log('doing thing', count++);
           insertRecord(rec, function () {
             cb();
             //setTimeout(cb, 1000);
           });
         })
       },
       function() {
         console.log('done, starting queue');
         processNextJob();
       });

function processNextJob() {
  const fn = jobs.shift();
  fn && fn(processNextJob);
}
