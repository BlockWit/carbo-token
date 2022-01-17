const { dateFromNow, getEvents, getTransactionCost, increaseDateTo } = require('./util');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CARBOToken');
const Sale = contract.fromArtifact('CrowdSale');
const Wallet = contract.fromArtifact('VestingWallet');

const [owner, manager, fundraisingWallet, buyer] = accounts;
const SUPPLY = ether('2500000');
const PRICE = 4348;

describe('CrowdSale', async function () {
  let token;
  let sale;
  let wallet;
  let STAGES;

  beforeEach(async function () {
    STAGES = [
      { start: await dateFromNow(1), end: await dateFromNow(8), bonus: 500, minInvestmentLimit: ether('0.03'), hardcap: ether('40000') },
      { start: await dateFromNow(9), end: await dateFromNow(11), bonus: 0, minInvestmentLimit: ether('0.03'), hardcap: ether('60000') }
    ];
    sale = await Sale.new({ from: owner });
    token = await Token.new([sale.address], [SUPPLY], { from: owner });
    wallet = await Wallet.new({ from: owner });
    await Promise.all([
      wallet.setToken(token.address, { from: owner }),
      sale.setToken(token.address, { from: owner }),
      sale.setFundraisingWallet(fundraisingWallet, { from: owner }),
      sale.setVestingWallet(wallet.address, { from: owner }),
      sale.setPrice(ether(PRICE.toString()), { from: owner })
    ]);
    await Promise.all(STAGES.map((stage, i) => {
      const { start, end, bonus, minInvestmentLimit, hardcap } = stage;
      return sale.setStage(i, start, end, bonus, minInvestmentLimit, hardcap, 0, 0, 0, { from: owner });
    }));
    await Promise.all([
      sale.transferOwnership(manager, { from: owner }),
      token.transferOwnership(manager, { from: owner }),
      wallet.transferOwnership(manager, { from: owner })
    ]);
  });

  it('should not accept ETH before crowdsale start', async function () {
    await expectRevert(sale.sendTransaction({ value: ether('1'), from: buyer }), 'CrowdSale: No suitable stage found');
  });

  it('should not accept ETH before crowdsale start', async function () {
    await expectRevert(sale.sendTransaction({ value: ether('1'), from: buyer }), 'CrowdSale: No suitable stage found');
  });

  it('should not accept ETH below min limit', async function () {
    await increaseDateTo(STAGES[0].start);
    await expectRevert(sale.sendTransaction({ value: ether('0.029'), from: buyer }), 'CrowdSale: The amount of ETH you sent is too small.');
  });

  it('should accept ETH above min limit', async function () {
    const { start, bonus } = STAGES[0];
    await increaseDateTo(start);
    const ethSent = ether('0.1');
    const { receipt: { transactionHash } } = await sale.sendTransaction({ value: ethSent, from: buyer });
    const events = await getEvents(transactionHash, token, 'Transfer', web3);
    const tokensExpected = ethSent.muln(PRICE).muln(100 + bonus).divn(100);
    const tokensReceived = new BN(events[0].args.value);
    expect(tokensReceived).to.be.bignumber.equal(tokensExpected);
  });

  it('should not return tokens above the hardcap', async function () {
    const { start, hardcap } = STAGES[0];
    await increaseDateTo(start);
    const ethSent = ether('99');
    const { receipt: { transactionHash } } = await sale.sendTransaction({ value: ethSent, from: buyer });
    const events = await getEvents(transactionHash, token, 'Transfer', web3);
    const tokensReceived = new BN(events[0].args.value);
    expect(tokensReceived).to.be.bignumber.equal(hardcap);
  });

  it('should calculate change correctly', async function () {
    const { start, bonus, hardcap } = STAGES[0];
    await increaseDateTo(start);
    const ethBalanceBefore = new BN(await web3.eth.getBalance(buyer));
    const ethSent = ether('100');
    const { receipt: { gasUsed, transactionHash } } = await sale.sendTransaction({ value: ethSent, from: buyer });
    const { gasPrice } = await web3.eth.getTransaction(transactionHash);
    const ethBalanceAfter = new BN(await web3.eth.getBalance(buyer));
    const tokensPerEth = PRICE * (100 + bonus) / 100;
    const ethSpent = hardcap.divn(tokensPerEth);
    const ethTxFee = new BN(gasUsed * gasPrice);
    expect(ethBalanceBefore.sub(ethSpent).sub(ethTxFee)).to.be.bignumber.equal(ethBalanceAfter);
  });

  it('should not accept ETH between crowdsale stages', async function () {
    await increaseDateTo(STAGES[0].end);
    await expectRevert(sale.sendTransaction({ value: ether('1'), from: buyer }), 'CrowdSale: No suitable stage found');
  });

  it('should accept ETH after the start of the next stage', async function () {
    const { start, bonus } = STAGES[1];
    await increaseDateTo(start);
    const ethSent = ether('0.123');
    const { receipt: { transactionHash } } = await sale.sendTransaction({ value: ethSent, from: buyer });
    const events = await getEvents(transactionHash, token, 'Transfer', web3);
    const tokensExpected = ethSent.muln(PRICE * (100 + bonus) / 100);
    const tokensReceived = new BN(events[0].args.value);
    expect(tokensReceived).to.be.bignumber.equal(tokensExpected);
  });

  it('should remove stage by index correctly', async function () {
    await sale.removeStage(0, { from: manager });
    const stage1 = await sale.getStage(1);
    expectStageToBeEqual(stage1, STAGES[1]);
    await expectRevert(sale.getStage(0), 'Stages.Map: nonexistent key');
  });
});

function expectStageToBeEqual (actual, expected) {
  expect(actual.start).to.be.bignumber.equal(new BN(expected.start));
  expect(actual.end).to.be.bignumber.equal(new BN(expected.end));
  expect(actual.bonus).to.be.bignumber.equal(new BN(expected.bonus));
  expect(actual.minInvestmentLimit).to.be.bignumber.equal(expected.minInvestmentLimit);
  expect(actual.hardcapInTokens).to.be.bignumber.equal(expected.hardcap);
}
