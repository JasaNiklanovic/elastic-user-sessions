const elasticsearch = require('elasticsearch');

const start = async () => {
  const client = new elasticsearch.Client({
    host: 'localhost:9200',
    // log: 'trace',
  });

  await client.ping({requestTimeout: 30000});
  console.log('pinged server once');

  try {
    await client.indices.create({index: 'user_sessions'});
    console.log('created index user_sessions');
  } catch (e) {
    if (e.status === 400) {
      console.log('index already exists');
    } else {
      throw e;
    }
  }

  // fake user sessions
  const payload = Array.apply(null, {length: 10000}).map(Number.call, Number).map(userId => {
    return Array.apply(null, {length: Math.floor(Math.random() * 10) + 1}).map(times => [
      {
        index: {_index: 'user_sessions', _type: 'session'},
      },
      {
        user_id: userId,
        created_at: new Date()
      },
    ]).reduce((acc, val) => acc.concat(val), [])
  })

  const body = payload.reduce((acc, val) => acc.concat(val), []);
  const bulk = await client.bulk({body});
};

start();
