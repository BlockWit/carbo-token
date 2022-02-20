const FeeManager = artifacts.require('FeeManager');
const { logger } = require('./util');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();
  const DIVIDENDMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--divs') + 1];
  const FEEMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--fees') + 1];

  const feeManager = await FeeManager.at(FEEMANAGER_ADDRESS);

  {
    log(`FeeManager. Set DividendManager.`);
    const tx = await feeManager.setDividendManager(DIVIDENDMANAGER_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`FeeManager. Set Fee addresses.`);
    const tx = await feeManager.setFeeAddresses(buyback, treasury, liquidity, {from: deployer});
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
