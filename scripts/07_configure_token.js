const Token = artifacts.require('CARBOToken');
const FeeManager = artifacts.require('FeeManager');
const { logger } = require('./util');
const ADDRESSES = require('addresses');

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
    const tx = await token.setCallbackContract(DIVIDENDMANAGER_ADDRESS, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Enable callback for INCREASE_BALANCE event`);
    const tx = await token.setCallbackFunction(2, true, {from: deployer})
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Enable callback for DECREASE_BALANCE event`);
    const tx = await token.setCallbackFunction(3, true, {from: deployer})
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
