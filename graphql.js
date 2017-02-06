const request = require('request');
const assert = require('assert');

const endpoint = 'http://localhost:8080/graphql';

function getPlayers() {
  request.post(endpoint, {
    json: {
      query: "{ players { userId, username } }"
    },
  }, (error, response, body) => {
    if (error) throw error;
    console.log(body.data.players);
  });
}

module.exports = {
  insertRecord(doc, cb) {
    request.post(endpoint, {
      json: {
        query: "mutation UpdatePlayer(\
$userId: Int!\
$username: String!\
$rating: Int! \
$rank: Int! \
$experience: Int! \
) { \
updatePlayer( \
  userId: $userId \
  username: $username \
  rating: $rating \
  rank: $rank \
  experience: $experience \
) { userId }\
}",
        variables: doc
      }
    }, (error, response, body) => {
      if (error) throw error;
      cb();
    });
  }
}
