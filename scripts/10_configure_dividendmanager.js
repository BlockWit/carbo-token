const DividendManager = artifacts.require('DividendManager');
const { logger } = require('./util');
const ADDRESSES = require('./addresses');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();
  const args = process.argv.slice(2);
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];
  const BUSD_ADDRESS = args[args.findIndex(argName => argName === '--busd') + 1];
  const CROWDSALE_ADDRESS = args[args.findIndex(argName => argName === '--sale') + 1];
  const WALLET_ADDRESS = args[args.findIndex(argName => argName === '--wallet') + 1];
  const DIVIDENDMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--divs') + 1];
  const SWAP_PAIR_ADDRESS = args[args.findIndex(argName => argName === '--pair') + 1];

  const dividendManager = await DividendManager.at(DIVIDENDMANAGER_ADDRESS);
  {
    log(`DividendManager. Set token.`);
    const tx = await dividendManager.setToken(TOKEN_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`DividendManager. Set busd.`);
    const tx = await dividendManager.setBUSD(BUSD_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`DividendManager. Exclude crowdsale address from dividends`);
    const tx = await dividendManager.excludeFromDividends(CROWDSALE_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`DividendManager. Exclude vesting wallet address from dividends`);
    const tx = await dividendManager.excludeFromDividends(WALLET_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`DividendManager. Exclude swap pair address from dividends`);
    const tx = await dividendManager.excludeFromDividends(SWAP_PAIR_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  log(`DividendManager. Exclude administrative addresses from dividends`);
  for (const key in ADDRESSES) {
    log(`${key}: ${ADDRESSES[key]}`);
    const tx = await dividendManager.excludeFromDividends(ADDRESSES[key], {from: deployer});
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
