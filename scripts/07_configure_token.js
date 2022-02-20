const Token = artifacts.require('CARBOToken');
const FeeManager = artifacts.require('FeeManager');
const { logger } = require('./util');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();
  const args = process.argv.slice(2);
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];
  const CROWDSALE_ADDRESS = args[args.findIndex(argName => argName === '--sale') + 1];
  const WALLET_ADDRESS = args[args.findIndex(argName => argName === '--wallet') + 1];
  const DIVIDENDMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--divs') + 1];
  const FEEMANAGER_ADDRESS = args[args.findIndex(argName => argName === '--fees') + 1];
  const SWAP_PAIR_ADDRESS = args[args.findIndex(argName => argName === '--pair') + 1];
  const BUY_FEES = {rfi: 0, dividends: 30, buyback: 5, treasury: 5, liquidity: 10};
  const SELL_FEES = {rfi: 40, dividends: 0, buyback: 0, treasury: 0, liquidity: 10};
  const ADDRESSES = {
    admin: '0x4A1C819e0158051237A15Ec4E5fD7bB490ADcea0',
    team: '0xBE9B3dda6798A05b7CA6B12ed4c1D6243D8edA03',
    buyback: '0xb7f498F6Fb9991EB7e91AE9EBE107Ec3EF7348E3',
    treasury: '0x2BBf69dc0b8B12439f9F587BeEb60Bd86b97615F',
    liquidity: '0x09622f5647651342C6eF1D674b7e30042c22e0d7',
    marketing: '0x56E6D5baCCf60b5710B4E06A082CF666267d7cC9',
    reserve: '0xa03031cc5bbb3B3a5dDd9dfB9CEEAab3d22bC8c9'
  };

  const token = await Token.at(TOKEN_ADDRESS);
  const feeManager = await FeeManager.at(FEEMANAGER_ADDRESS);

  const BUY_FEE_ADDRESS = await feeManager.buyFeeHolder();
  const SELL_FEE_ADDRESS = await feeManager.sellFeeHolder();

  {
    log(`Token. Set buy fees`);
    const tx = await token.setFees(0, BUY_FEES.rfi, BUY_FEES.dividends, BUY_FEES.buyback, BUY_FEES.treasury, BUY_FEES.liquidity, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Set sell fees`);
    const tx = await token.setFees(1, SELL_FEES.rfi, SELL_FEES.dividends, SELL_FEES.buyback, SELL_FEES.treasury, SELL_FEES.liquidity, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Set buy fee addresses`);
    const tx = await token.setFeeAddresses(0, BUY_FEE_ADDRESS, BUY_FEE_ADDRESS, BUY_FEE_ADDRESS, BUY_FEE_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Set sell fee addresses`);
    const tx = await token.setFeeAddresses(1, SELL_FEE_ADDRESS, SELL_FEE_ADDRESS, SELL_FEE_ADDRESS, SELL_FEE_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Set callback contract`);
    const tx = await token.setCallback(DIVIDENDMANAGER_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Exclude buy fee address from RFI`);
    const tx = await token.excludeFromRFI(BUY_FEE_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Exclude sell fee address from RFI`);
    const tx = await token.excludeFromRFI(SELL_FEE_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Exclude crowdsale address from RFI`);
    const tx = await token.excludeFromRFI(CROWDSALE_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Exclude vesting wallet address from RFI`);
    const tx = await token.excludeFromRFI(WALLET_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Exclude swap pair address from RFI`);
    const tx = await token.excludeFromRFI(SWAP_PAIR_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Make transactions to/from swap pair taxable`);
    const tx = await token.setTaxable(SWAP_PAIR_ADDRESS, true, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Exempt fee manager from tax`);
    const tx = await token.setTaxExempt(feeManager.address, true, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }

  log(`Token. Exclude administrative addresses from RFI`);
  for (const key in ADDRESSES) {
    log(`${key}: ${ADDRESSES[key]}`);
    const tx = await token.excludeFromRFI(ADDRESSES[key], {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }

  log(`Token. Exempt administrative addresses from tax`);
  for (const key in ADDRESSES) {
    log(`${key}: ${ADDRESSES[key]}`);
    const tx = await token.setTaxExempt(ADDRESSES[key], true, {from: deployer});
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
