var expect  = require('chai').expect;
let Reporting = require('../reporting.js')

it('should return an array of user sessions data', async () => {
  const result = await new Reporting().process([1355, 315, 1535, 5135, 333, 1, 8824, 9999, 1000000, 666])
  expect(result).to.be.an('array')
  expect(result[0]).to.have.property('name')
});