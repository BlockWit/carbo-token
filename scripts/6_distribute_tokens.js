const TokenDepositor = artifacts.require('TokenDepositor');
const { ether } = require('@openzeppelin/test-helpers');
const { fromCSV, logger } = require('./util');
const fs = require('fs');

async function deploy () {
  const args = process.argv.slice(2);
  const DEPOSITOR_ADDRESS = args[args.findIndex(argName => argName === '--depositor') + 1];

  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();

  const depositor = await TokenDepositor.at(DEPOSITOR_ADDRESS);
  {
    log(`Depositor. Airdrop.`);
    const unlocked = 0;
    const schedule = 6;
    const addresses = ['0xEb39C884d2C7B54520D0F9a24E0ffcf1aE6B58D0'];
    const balances = [ether('4170000')];
    const tx = await depositor.deposit(unlocked, schedule, addresses, balances, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Depositor. Locked Liquidity.`);
    const unlocked = 0;
    const schedule = 7;
    const addresses = ['0x0113518FBcE33BA055d3753DaF0903f64a49554E'];
    const balances = [ether('30000000')];
    const tx = await depositor.deposit(unlocked, schedule, addresses, balances, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Depositor. Staking and Farming.`);
    const unlocked = 0;
    const schedule = 8;
    const addresses = ['0x7bd37252Fd94D98Dd9aF3e1aB45a58aC31B8a45F'];
    const balances = [ether('20000000')];
    const tx = await depositor.deposit(unlocked, schedule, addresses, balances, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Depositor. Marketing.`);
    const unlocked = 0;
    const schedule = 9;
    const addresses = ['0xD00e8C8151Fadc16392796c50327E73d20Bb0dc1'];
    const balances = [ether('150000000')];
    const tx = await depositor.deposit(unlocked, schedule, addresses, balances, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Depositor. Advisors.`);
    const unlocked = 0;
    const schedule = 10;
    const addresses = ['0x68E543680f1b91236c30d009FFE699f7f8DE1a49'];
    const balances = [ether('30000000')];
    const tx = await depositor.deposit(unlocked, schedule, addresses, balances, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Depositor. Launch Team.`);
    const unlocked = 0;
    const schedule = 11;
    const addresses = ['0xf1edD24D2c517A17Ab1D32EE8d46C327c1389539'];
    const balances = [ether('25000000')];
    const tx = await depositor.deposit(unlocked, schedule, addresses, balances, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Depositor. Development Team.`);
    const unlocked = 0;
    const schedule = 12;
    const addresses = ['0x594c80E7dF5775b142587Cf3A609a010248EaBEc'];
    const balances = [ether('25000000')];
    const tx = await depositor.deposit(unlocked, schedule, addresses, balances, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`Depositor. Reserves.`);
    const unlocked = 0;
    const schedule = 13;
    const addresses = ['0x9241750A09CdB56D33582e2Ea92Ed448806B8f53'];
    const balances = [ether('500830000')];
    const tx = await depositor.deposit(unlocked, schedule, addresses, balances, { from: deployer });
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
