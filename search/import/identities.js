const elasticsearch = require('elasticsearch');

const start = async () => {
  const client = new elasticsearch.Client({
    host: 'localhost:9200',
    // log: 'trace',
  });

  await client.ping({requestTimeout: 30000});
  console.log('pinged server');

  try {
    await client.indices.create({index: 'client_database_1'});
    console.log('created index client_database_1');
  } catch (e) {
    if (e.status === 400) {
      console.log('index exists');
    } else {
      throw e;
    }
  }

  // fake client user identities
  const db = await client.bulk({
    body: [
      { index:  { _index: 'client_database_1', _type: 'user' } },
      { userId: 3535, name: 'Jack' },
      
      { index:  { _index: 'client_database_1', _type: 'user' } },
      { userId: 1355, name: 'John' },

      { index:  { _index: 'client_database_1', _type: 'user' } },
      { userId: 5135, name: 'Janice' },

      { index:  { _index: 'client_database_1', _type: 'user' } },
      { userId: 31335, name: 'Charlie' }
    ]
  });

};

start();
