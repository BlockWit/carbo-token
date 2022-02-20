const DividendManager = artifacts.require('DividendManager');
const { logger } = require('./util');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();
  const args = process.argv.slice(2);
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];
  const BUSD_ADDRESS = args[args.findIndex(argName => argName === '--busd') + 1];
  const CROWDSALE_ADDRESS = args[args.findIndex(argName => argName === '--sale') + 1];
  const WALLET_ADDRESS = args[args.findIndex(argName => argName === '--wallet') + 1];
  const DIVIDENDMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--divs') + 1];
  const FEEMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--fees') + 1];
  const SWAP_PAIR_ADDRESS = args[args.findIndex(argName => argName === '--pair') + 1];
  const ADDRESSES = {
    admin: '0x4A1C819e0158051237A15Ec4E5fD7bB490ADcea0',
    team: '0xBE9B3dda6798A05b7CA6B12ed4c1D6243D8edA03',
    buyback: '0xb7f498F6Fb9991EB7e91AE9EBE107Ec3EF7348E3',
    treasury: '0x2BBf69dc0b8B12439f9F587BeEb60Bd86b97615F',
    liquidity: '0x09622f5647651342C6eF1D674b7e30042c22e0d7',
    marketing: '0x56E6D5baCCf60b5710B4E06A082CF666267d7cC9',
    reserve: '0xa03031cc5bbb3B3a5dDd9dfB9CEEAab3d22bC8c9'
  };

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
