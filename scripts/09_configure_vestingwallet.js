const VestingWallet = artifacts.require('VestingWallet');
const { logger } = require('./util');
const { time } = require('@openzeppelin/test-helpers');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();
  const args = process.argv.slice(2);
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];
  const WALLET_ADDRESS = args[args.findIndex(argName => argName === '--wallet') + 1];

  const DAY_0 = time.duration.seconds(Math.floor(new Date('April 24 2022 13:00:00 UTC') / 1000).toString());

  /* eslint-disable no-multi-spaces */
  const VESTING_SCHEDULES = [
    { id: 0,  start: DAY_0,                                   duration: time.duration.days('0'),   interval: time.duration.days('0')  },
    { id: 1,  start: DAY_0.add(time.duration.hours('0')), duration: time.duration.days('0'),   interval: time.duration.days('0') },  // public sale
    { id: 2,  start: DAY_0.sub(time.duration.days('23')), duration: time.duration.days('750'), interval: time.duration.days('30') }, // team tokens
    { id: 3,  start: DAY_0.sub(time.duration.days('23')), duration: time.duration.days('450'), interval: time.duration.days('90') }, // marketing tokens
  ];
  /* eslint-enable no-multi-spaces */

  const wallet = await VestingWallet.at(WALLET_ADDRESS);

  {
    log(`Wallet. Set token.`);
    const tx = await wallet.setToken(TOKEN_ADDRESS, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }

  log(`Wallet. Set vesting schedules.`);
  for (const { id, start, duration, interval } of VESTING_SCHEDULES) {
    log(`Schedule #${id}`);
    const tx = await wallet.setVestingSchedule(id, start, duration, interval, { from: deployer });
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
