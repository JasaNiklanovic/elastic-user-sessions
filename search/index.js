const elasticsearch = require('elasticsearch');
const _ = require('underscore');

const USER_IDS = [1355, 315, 1535, 5135, 333, 1, 8824, 9999, 1000000, 666]
const METADATA = [
  {
    "client_database_1": [1355, 3535, 5135, 31335]
  }, {
    "client_database_2": [8824, 9998, 666, 12, 5]
  }
]

class Reporting{

  constructor(){
      this.client = new elasticsearch.Client({
        host: 'localhost:9200',
      });
  }

  async index (userIDs) {
    const self = this;

    await this.client.ping({requestTimeout: 30000});
    console.log('pinged server');
  
    // get user sessions by array of user_ids
    const resp = await this.client.search({
      index: 'user_sessions',
      body: {
        "query": {
          "constant_score" : {
              "filter" : {
                  "terms" : { 
                      "user_id" : userIDs
                  }
              }
          }
        },
        "aggs" : {
            "sessions": {
              "terms": {
                "field": "user_id"
              }
            }
        }
      },
    });
    
    const {buckets} = resp.aggregations.sessions;
    const metadata = this.metadata(userIDs)

    Object.keys(metadata).forEach(async (databaseID) => {
      let identity = await self.identity(databaseID, _.pluck(metadata[databaseID], 'userID'))
      console.log(identity, buckets, metadata, 'results')
    })
  }

  // Metadata function: You give it a list of user IDs and it gives you a map where user IDs 
  // are keys and corresponding database IDs are values.
  metadata (userIDs) {
    let data = userIDs.map((userID) => {
      return {userID: userID, databaseID: 'client_database_1'} // faked db
    })

    return _.groupBy(data, (item) => {
      return item.databaseID
    })
  }
  
  // Identity function: you give it a database ID (that you received from the metadata function) 
  // and a list of user IDs (that you expect to find in that database) and it gives you a map 
  // where user IDs are keys and their names are values.
  async identity (databaseID, userIDs) {
    const resp = await this.client.search({
      index: databaseID,
      body: {
        "query": {
          "constant_score" : {
              "filter" : {
                  "terms" : { 
                      "userId" : userIDs
                  }
              }
          }
        }
      },
    });

    const {hits} = resp.hits;
    return hits.map((hit) => {
      return {userID: hit._source.userId, name: hit._source.name}
    })
  }
  
  // Statistics function: you give it a list of user IDs and it gives you a map where user IDs 
  // are keys and their session counts are values.
  async statistics (userIDs) {
    // return [{userID: sessionCount}]
  }
}

const reporting = new Reporting()
reporting.index(USER_IDS);
