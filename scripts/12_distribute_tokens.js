const CarboToken = artifacts.require('CarboToken');
const VestingWallet = artifacts.require('VestingWallet');
const { logger } = require('./util');
const { ether } = require('@openzeppelin/test-helpers');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();
  const args = process.argv.slice(2);
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];
  const CROWDSALE_ADDRESS = args[args.findIndex(argName => argName === '--sale') + 1];
  const WALLET_ADDRESS = args[args.findIndex(argName => argName === '--wallet') + 1];
  const ADDRESSES = {
    admin: '0x4A1C819e0158051237A15Ec4E5fD7bB490ADcea0',
    team: '0xBE9B3dda6798A05b7CA6B12ed4c1D6243D8edA03',
    buyback: '0xb7f498F6Fb9991EB7e91AE9EBE107Ec3EF7348E3',
    treasury: '0x2BBf69dc0b8B12439f9F587BeEb60Bd86b97615F',
    liquidity: '0x09622f5647651342C6eF1D674b7e30042c22e0d7',
    marketing: '0x56E6D5baCCf60b5710B4E06A082CF666267d7cC9',
    reserve: '0xa03031cc5bbb3B3a5dDd9dfB9CEEAab3d22bC8c9'
  };
  const BALANCES = {
    crowdsale:          ether('300000000'),
    team:               ether('50000000'),
    marketingLocked:    ether('12500000'),
    marketingUnlocked:  ether('12500000'),
    reserve:            ether('25000000'),
    liquidity:          ether('100000000')
  }

  const token = await CarboToken.at(TOKEN_ADDRESS);
  const wallet = await VestingWallet.at(WALLET_ADDRESS);
  {
    log(`Token. Send to CrowdSale contract`);
    const tx = await token.transfer(CROWDSALE_ADDRESS, BALANCES.crowdsale, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Send unlocked marketing tokens`);
    const tx = await token.transfer(ADDRESSES.marketing, BALANCES.marketingUnlocked, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Send company reserve`);
    const tx = await token.transfer(ADDRESSES.reserve, BALANCES.reserve, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Send liquidity tokens`);
    const tx = await token.transfer(ADDRESSES.liquidity, BALANCES.liquidity, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Token. Increase allowance`);
    const tx = await token.approve(WALLET_ADDRESS, BALANCES.team.add(BALANCES.marketingLocked), {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`VestingWallet. deposit team tokens`);
    const tx = await wallet.deposit(2, ADDRESSES.team, BALANCES.team, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`VestingWallet. deposit marketing tokens`);
    const tx = await wallet.deposit(3, ADDRESSES.marketing, BALANCES.marketingLocked, {from: deployer});
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
