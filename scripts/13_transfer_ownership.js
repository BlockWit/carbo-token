const CarboToken = artifacts.require('CarboToken');
const CrowdSale = artifacts.require('CrowdSale');
const DividendManager = artifacts.require('DividendManager');
const FeeManager = artifacts.require('FeeManager');
const VestingWallet = artifacts.require('VestingWallet');
const { logger } = require('./util');
const { admin: ADMINISTRATOR_ADDRESS } = require('./addresses');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();
  const args = process.argv.slice(2);
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];
  const CROWDSALE_ADDRESS = args[args.findIndex(argName => argName === '--sale') + 1];
  const WALLET_ADDRESS = args[args.findIndex(argName => argName === '--wallet') + 1];
  const DIVIDENDMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--divs') + 1];
  const FEEMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--fees') + 1];

  const token = await CarboToken.at(TOKEN_ADDRESS);
  const sale = await CrowdSale.at(CROWDSALE_ADDRESS);
  const dividendManager = await DividendManager.at(DIVIDENDMANAGER_ADDRESS);
  const feeManager = await FeeManager.at(FEEMANAGER_ADDRESS);
  const wallet = await VestingWallet.at(WALLET_ADDRESS);
  {
    log(`Token. Transfer ownership`);
    const tx = await token.transferOwnership(ADMINISTRATOR_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`CrowdSale. Transfer ownership`);
    const tx = await sale.transferOwnership(ADMINISTRATOR_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`DividendManager. Transfer ownership`);
    const tx = await dividendManager.transferOwnership(ADMINISTRATOR_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`FeeManager. Transfer ownership`);
    const tx = await feeManager.transferOwnership(ADMINISTRATOR_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`VestingWallet. Transfer ownership`);
    const tx = await wallet.transferOwnership(ADMINISTRATOR_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }

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
