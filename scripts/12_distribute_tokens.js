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
    admin: '0x1425234cc5F42D2aAa2db1E2088CeC81E6caaF9E',
    team: '0x924bFf61da5B81ecCc58607e3CB76A00aa6201cf',
    buyback: '0x5FF5763964aC663Ec6CDcCf9836306301AED64C0',
    treasury: '0xA7E8cB251033990cFFC3C10131f35BB122b321fB',
    liquidity: '0x8441220eFF1370A24f1400f79C06558c3C5A48fa',
    marketing: '0xa48d081d79FB257eEA71791B99D535858Ad8B1DC',
    reserve: '0xA5B10a6A78dF992Fd06587400378010BD248278b',
    airdrop: '0x1D2d2B2DddA02500B97f08f361AFb17751a27728'
  };
  const BALANCES = {
    crowdsale:          ether('250000000'),
    team:               ether( '50000000'),
    marketingLocked:    ether( '20000000'),
    marketingUnlocked:  ether( '20000000'),
    reserve:            ether( '25000000'),
    liquidity:          ether('100000000'),
    airdrop:            ether( '35000000')
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
    log(`Token. Send airdrop tokens`);
    const tx = await token.transfer(ADDRESSES.airdrop, BALANCES.airdrop, {from: deployer});
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
