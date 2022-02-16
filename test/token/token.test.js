const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { balance, BN, constants, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert, expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const { shouldBehaveLikeERC20 } = require('../behaviors/ERC20.behavior');
const { shouldBehaveLikeRecoverableFunds } = require('../behaviors/RecoverableFunds.behaviour');

const Token = contract.fromArtifact('CARBOToken');

const [account1, account2, account3, owner ] = accounts;
const TOTAL_SUPPLY = ether('500000000');

describe('ERC20', function () {
  beforeEach(async function () {
    this.token = await Token.new({ from: owner });
  });
  shouldBehaveLikeERC20("ERC20", TOTAL_SUPPLY, owner, account1, account2);
});

describe('RecoverableFunds', function () {
  beforeEach(async function () {
    this.testedContract = await Token.new([account1], [TOTAL_SUPPLY], { from: owner });
  });
  shouldBehaveLikeRecoverableFunds(owner, account2, account3);
});

describe('CARBOToken', async function () {
  let token;

  beforeEach(async function () {
    token = await Token.new({ from: owner });
  });

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      expect(await token.totalSupply()).to.be.bignumber.equal(TOTAL_SUPPLY);
    });
  });

  describe('transfer', function () {
    it('works correctly', async function () {
      const balance1Before = await token.balanceOf(owner);
      const balance2Before = await token.balanceOf(account2);
      const amountToTransfer = ether('123321');
      await token.transfer(account2, amountToTransfer, { from: owner });
      const balance1After = await token.balanceOf(owner);
      const balance2After = await token.balanceOf(account2);
      expect(balance1After).to.be.bignumber.equal(balance1Before.sub(amountToTransfer));
      expect(balance2After).to.be.bignumber.equal(balance2Before.add(amountToTransfer));
    });
  });
});