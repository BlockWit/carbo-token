const Token = artifacts.require('CARBOToken');
const { logger } = require('./util');

async function deploy () {
  const args = process.argv.slice(2);
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];

  const LIQUIDITY_RESTRICTION_ADDRESS = '0xeD1261C063563Ff916d7b1689Ac7Ef68177867F2';

  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();

  const token = await Token.at(TOKEN_ADDRESS);

  log(`Token. Set liquidity restriction address.`);
  const tx = await token.setLiquidityRestrictionAddress(LIQUIDITY_RESTRICTION_ADDRESS, { from: deployer });
  log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
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
