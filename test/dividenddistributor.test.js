const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const CarboToken = contract.fromArtifact('CarboToken');
const DividendManager = contract.fromArtifact('DividendManager');
const ERC20Mock = contract.fromArtifact('ERC20Mock');

const [owner, buyer] = accounts;

describe('DividendManager', async function () {
  let token;
  let dividendManager;
  let busd;

  beforeEach(async function () {
    token = await CarboToken.new({from: owner});
    dividendManager = await DividendManager.new({from: owner});
    busd = await ERC20Mock.new('BUSD', 'BUSD', owner, ether('1000000000'), {from: owner});
    await dividendManager.setToken(busd.address, {from: owner});
    await dividendManager.setMaster(token.address, {from: owner});
    await token.setDividendManager(dividendManager.address, {from: owner});
  });

  it('should sum correctly', async function () {
    const initialBalance = await token.balanceOf(owner);
    const tokenTotalSupply = await token.totalSupply();
    const reflectionFromToken = await token.reflectionFromToken(initialBalance);
    console.log(initialBalance.toString());
    console.log(tokenTotalSupply.toString());
    console.log(reflectionFromToken.toString());
    const totalSupply = await dividendManager.getTotalSupply();
    console.log(totalSupply.toString());
    await busd.transfer(dividendManager.address, ether('1000000'), {from: owner});
    await token.distributeDividends();
    await token.transfer()
    const dividendPerShare = await dividendManager.dividendPerShare();
    console.log(dividendPerShare.toString());
    const dividend = await token.accumulativeDividendOf(owner);
    console.log(dividend.toString());
  });

});
