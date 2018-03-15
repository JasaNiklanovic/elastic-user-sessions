const elasticsearch = require('elasticsearch');
const _ = require('underscore');


// in a real world situation this would come from a database, this will assume there are 2 databases that contain userIDs
const METADATA = [
  {
    "client_database_1": [1355, 3535, 5135, 31335]
  }, {
    "client_database_2": [8824, 9998, 666, 12, 5]
  }
]

module.exports = class Reporting{

  constructor(){
      this.client = new elasticsearch.Client({
        host: 'localhost:9200',
      })
  }

  async process (userIDs) {
    const self = this

    try {
      await this.client.ping({requestTimeout: 30000})
      console.log('pinged server')
    } catch (e) {
      console.warn(e, 'pinged server fail, make sure elasticsearch is running ...')
    }
  
    // get user sessions by array of userIDs
    
    const statistics = await this.statistics(userIDs)
    const metadata = this.metadata(userIDs)

    // loop through all databases, fetch identities, match with sessions.
    return Promise.all(Object.keys(metadata).map(async (databaseID) => {
      return await self.identity(databaseID, _.pluck(metadata[databaseID], 'userID'))

    })).then((values) => {
      return values[0].map((value) => {
        let userStatistics = _.findWhere(statistics, {userID: value.userID})
        value.sessions = userStatistics ? userStatistics.sessions : 0
        return value
      })

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
    try {
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
      })
      const {hits} = resp.hits;
      return hits.map((hit) => {
        return {userID: hit._source.userId, name: hit._source.name}
      })
    } catch (e) {
      console.warn(e, 'fetching identities error')
      return []
    }
  }
  
  // Statistics function: you give it a list of user IDs and it gives you a map where user IDs 
  // are keys and their session counts are values.
  async statistics (userIDs) {
    try {
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
      })
      const {buckets} = resp.aggregations.sessions
      return buckets.map((bucket) => {
        return {userID: bucket.key, sessions: bucket.doc_count}
      })
    } catch (e) {
      console.warn(e, 'fetching user sessions error')
      return []
    }
  }
}