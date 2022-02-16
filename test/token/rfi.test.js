const { accounts, contract } = require('@openzeppelin/test-environment');
const { ether, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CARBOToken');

const [deployer, owner, account1, account2 ] = accounts;

describe('CARBOToken', async function () {
  let token;

  beforeEach(async function () {
    token = await Token.new({from: deployer});
    await token.transferOwnership(owner, {from: deployer})
  });

  describe('excludeFromRFI', function () {
    describe('when called by non-owner', function () {
      it('should revert', async function () {
        await expectRevert(token.excludeFromRFI(deployer, {from: deployer}), "Ownable: caller is not the owner");
      });
    });
    describe('when called by owner', function () {
      it('should exclude address from RFI', async function () {
        await token.excludeFromRFI(deployer, {from: owner});
      });
      describe('when address already excluded', function () {
        it('should revert', async function () {
          await token.excludeFromRFI(deployer, {from: owner});
          await expectRevert(token.excludeFromRFI(deployer, {from: owner}), "CarboToken: account is already excluded");
        });
      })
    });
  });

  describe('includeInRFI', function () {
    describe('when called by non-owner', function () {
      it('should revert', async function () {
        await expectRevert(token.includeInRFI(deployer, {from: deployer}), "Ownable: caller is not the owner");
      });
    });
    describe('when called by owner', function () {
      it('should include address from RFI', async function () {
        await token.excludeFromRFI(deployer, {from: owner});
        await token.includeInRFI(deployer, {from: owner});
      });
      describe('when address already included', function () {
        it('should revert', async function () {
          await expectRevert(token.includeInRFI(deployer, {from: owner}), "CarboToken: account is already included");
        });
      })
    });
  });

  describe('reflect', function () {
    beforeEach(async function () {
      await token.transfer(account1, ether('12345'), {from: deployer});
      await token.transfer(account2, ether('23456'), {from: deployer});
    })
    it('should increase balance of usual account', async function() {
      const [balance1before, balance2before] = await Promise.all([account1, account2].map(address => token.balanceOf(address)));
      const amount = ether('123');
      await token.reflect(amount, {from: account1});
      const [balance1after, balance2after] = await Promise.all([account1, account2].map(address => token.balanceOf(address)));
      const diff1 = balance1after.add(amount).sub(balance1before);
      const diff2 = balance2after.sub(balance2before);
      const ratio1 = balance1after.div(diff1);
      const ratio2 = balance2after.div(diff2);
      expect(ratio1).to.be.bignumber.equal(ratio2);
    });
    it('should not increase balance of excluded account', async function() {
      const [balance1before, balance2before, balance3before] = await Promise.all([account1, account2, deployer].map(address => token.balanceOf(address)));
      const amount = ether('123');
      await token.excludeFromRFI(deployer, {from: owner});
      await token.reflect(amount, {from: account1});
      const [balance1after, balance2after, balance3after] = await Promise.all([account1, account2, deployer].map(address => token.balanceOf(address)));
      const diff1 = balance1after.add(amount).sub(balance1before);
      const diff2 = balance2after.sub(balance2before);
      const ratio1 = balance1after.div(diff1);
      const ratio2 = balance2after.div(diff2);
      expect(balance3after).to.be.bignumber.equal(balance3before);
      expect(ratio1).to.be.bignumber.equal(ratio2);
    });
  })

  //--------------------------------------------------------------------------------------------------------------------
  // helpers
  //--------------------------------------------------------------------------------------------------------------------

});

