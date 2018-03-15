const Reporting = require('./reporting.js')
const USER_IDS = [1355, 315, 1535, 5135, 333, 1, 8824, 9999, 1000000, 666]

const index = async () => {
  try {
    const result = await new Reporting().process(USER_IDS)
    console.log(result, 'result')
  } catch (e) {
    console.log(e)
  }
}

index()
