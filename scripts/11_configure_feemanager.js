const FeeManager = artifacts.require('FeeManager');
const { logger } = require('./util');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();
  const args = process.argv.slice(2);
  const DIVIDENDMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--divs') + 1];
  const FEEMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--fees') + 1];
  const ADDRESSES = {
    buyback: '0xb7f498F6Fb9991EB7e91AE9EBE107Ec3EF7348E3',
    treasury: '0x2BBf69dc0b8B12439f9F587BeEb60Bd86b97615F',
    liquidity: '0x09622f5647651342C6eF1D674b7e30042c22e0d7'
  };

  const feeManager = await FeeManager.at(FEEMANAGER_ADDRESS);

  {
    log(`FeeManager. Set DividendManager.`);
    const tx = await feeManager.setDividendManager(DIVIDENDMANAGER_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`FeeManager. Set Fee addresses.`);
    const { buyback, treasury, liquidity } = ADDRESSES;
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
