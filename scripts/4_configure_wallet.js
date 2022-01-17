const Wallet = artifacts.require('VestingWallet');
const { logger } = require('./util');
const { time } = require('@openzeppelin/test-helpers');

async function deploy () {
  const args = process.argv.slice(2);
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];
  const WALLET_ADDRESS = args[args.findIndex(argName => argName === '--wallet') + 1];

  const DAY_0 = time.duration.seconds(Math.floor(new Date('Jan 12 2022 12:00:00 UTC') / 1000).toString());

  /* eslint-disable no-multi-spaces */
  const VESTING_SCHEDULES = [
    { id: 0,  start: DAY_0,                                     duration: time.duration.days('0'),   interval: time.duration.days('0')  },
    { id: 1,  start: DAY_0.add(time.duration.days('150')),  duration: time.duration.days('360'), interval: time.duration.days('30') }, // round A
    { id: 2,  start: DAY_0.add(time.duration.days('60')),   duration: time.duration.days('360'), interval: time.duration.days('30') }, // round B
    { id: 3,  start: DAY_0.add(time.duration.days('60')),   duration: time.duration.days('450'), interval: time.duration.days('30') }, // round C
    { id: 4,  start: DAY_0.add(time.duration.days('150')),  duration: time.duration.days('360'), interval: time.duration.days('30') }, // round D
    { id: 5,  start: DAY_0.sub(time.duration.days('30')),   duration: time.duration.days('150'), interval: time.duration.days('30') }, // public sale
    { id: 6,  start: DAY_0,                                     duration: time.duration.days('360'), interval: time.duration.days('30') }, // airdrop
    { id: 7,  start: DAY_0,                                     duration: time.duration.days('0'),   interval: time.duration.days('0')  }, // liquidity
    { id: 8,  start: DAY_0,                                     duration: time.duration.days('360'), interval: time.duration.days('30') }, // farming
    { id: 9,  start: DAY_0,                                     duration: time.duration.days('540'), interval: time.duration.days('30') }, // marketing
    { id: 10, start: DAY_0.add(time.duration.days('150')),  duration: time.duration.days('360'), interval: time.duration.days('30') }, // advisors
    { id: 11, start: DAY_0,                                     duration: time.duration.days('360'), interval: time.duration.days('30') }, // launch team
    { id: 12, start: DAY_0.add(time.duration.days('60')),   duration: time.duration.days('720'), interval: time.duration.days('30') }, // dev team
    { id: 13, start: DAY_0.add(time.duration.days('150')),  duration: time.duration.days('720'), interval: time.duration.days('30') }  // reserve
  ];
  /* eslint-enable no-multi-spaces */

  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();

  const wallet = await Wallet.at(WALLET_ADDRESS);

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
