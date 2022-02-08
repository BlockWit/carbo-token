const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const FullMathMock = contract.fromArtifact('FullMathMock');

describe('CrowdSale', async function () {
  let fullMath;

  before(async function () {
    fullMath = await FullMathMock.new();
  });

  it('should sum correctly', async function () {
    const a1 = new BN("500")
    const a2 = new BN("2")
    const {r0, r1} = await fullMath.mul(a1, a2);
    console.log(r0.toString(), r1.toString());
    // expect(await bn.inv(a1)).to.be.bignumber.equal(a2);
  });

  it('should invert correctly', async function () {
    const a = new BN("1")
    const r = await fullMath.inv(a);
    console.log(r.toString());
    // expect(await bn.inv(a1)).to.be.bignumber.equal(a2);
  });
});
