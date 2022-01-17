const Token = artifacts.require('CARBOToken');
const TokenDepositor = artifacts.require('TokenDepositor');
const Sale = artifacts.require('CrowdSale');
const Wallet = artifacts.require('VestingWallet');
const { logger } = require('./util');
const { ether } = require('@openzeppelin/test-helpers');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();

  const wallet = await Wallet.new({ from: deployer });
  log(`Wallet deployed: @address{${wallet.address}}`);

  const sale = await Sale.new({ from: deployer });
  log(`Sale deployed: @address{${sale.address}}`);

  const depositor = await TokenDepositor.new({ from: deployer });
  log(`Depositor deployed: @address{${depositor.address}}`);

  const token = await Token.new([depositor.address], [ether('1000000000')], { from: deployer });
  log(`Token deployed: @address{${token.address}}`);
}

module.exports = async function main (callback) {
  try {
    await deploy();
    console.log('success');
    callback(null);
  } catch (e) {
    console.log('error');
    console.log(e);
    callback(e);
  }
};
