const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const assert = require('assert');

const scrape = (login, password, count, handler) => {
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
          const username = cols.eq(3).text();
          const rating = +cols.eq(4).text();
          const experience = +cols.eq(6).text();

          handler && handler({ rank, username, rating, experience });
        });
      });
  });
}

const login = process.env.USERNAME;
const password = process.env.PASSWORD;

assert(login, '$USERNAME not set');
assert(password, '$PASSWORD not set');

scrape(login, password, 100, function (o) {
  console.log(o.username);
});
