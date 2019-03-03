const assert = require('assert');
const scrape = require('./scrape')
const MongoClient = require('mongodb')

const { USERNAME, PASSWORD, MONGODB_URI } = process.env

assert(USERNAME, '$USERNAME not set')
assert(PASSWORD, '$PASSWORD not set')
assert(MONGODB_URI, '$MONGODB_URI not set')

const createdAt = new Date()

let connection
let Ratings

async function main() {
  connection = await MongoClient.connect(MONGODB_URI, { useNewUrlParser: true })
  Ratings = connection.db().collection('ratings')
}

main()

scrape(USERNAME, PASSWORD, 10000, saveToMongo,
       function() {
         connection.close()
         console.log('scrape done');
       });

async function saveToMongo(rec) {
  console.log('saving', rec.rank)
  await Ratings.insertOne({ ...rec, createdAt })
  console.log('saving', rec.rank, 'done')
}
