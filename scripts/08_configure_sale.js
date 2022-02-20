const CrowdSale = artifacts.require('CrowdSale');
const { ether } = require('@openzeppelin/test-helpers');

const { logger } = require('./util');

async function deploy () {
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();
  const SALE_ADDRESS = args[args.findIndex(argName => argName === '--sale') + 1];
  const TOKEN_ADDRESS = args[args.findIndex(argName => argName === '--token') + 1];
  const WALLET_ADDRESS = args[args.findIndex(argName => argName === '--wallet') + 1];

  const PRICE = ether('10000');
  const FUNDRAISING_WALLET = '0x4A1C819e0158051237A15Ec4E5fD7bB490ADcea0';
  const STAGE1 = {
    id: 0,
    start: 1647774000, // March 20 2022 11:00 UTC
    end: 1648378800, // March 27 2022 11:00 UTC
    bonus: 0,
    minInvestmentLimit: ether('1'),
    maxInvestmentLimit: ether('50'),
    hardcap: ether('300000000'),
    vestingSchedule: 1,
    whitelist: true
  };
  const STAGE2 = {
    id: 1,
    start: 1648378800, // March 27 2022 11:00 UTC'
    end: 16488972000, // April 2 2022 11:00 UTC
    bonus: 0,
    minInvestmentLimit: ether('1'),
    maxInvestmentLimit: ether('300000000'),
    hardcap: ether('300000000'),
    vestingSchedule: 1,
    whitelist: false
  };

  const sale = await CrowdSale.at(SALE_ADDRESS);

  {
    log(`CrowdSale. Set token.`);
    const tx = await sale.setToken(TOKEN_ADDRESS, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`CrowdSale. Set fundraising wallet.`);
    const tx = await sale.setFundraisingWallet(FUNDRAISING_WALLET, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`CrowdSale. Set vesting wallet.`);
    const tx = await sale.setVestingWallet(WALLET_ADDRESS, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`CrowdSale. set price.`);
    const tx = await sale.setPrice(PRICE, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`CrowdSale. set stage 1.`);
    const { id, start, end, bonus, minInvestmentLimit, maxInvestmentLimit, hardcap, vestingSchedule, whitelist } = STAGE1;
    const tx = await sale.setStage(id, start, end, bonus, minInvestmentLimit, maxInvestmentLimit, hardcap, vestingSchedule, 0, 0, whitelist, { from: deployer });
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`CrowdSale. set stage 2.`);
    const { id, start, end, bonus, minInvestmentLimit, maxInvestmentLimit, hardcap, vestingSchedule, whitelist } = STAGE2;
    const tx = await sale.setStage(id, start, end, bonus, minInvestmentLimit, maxInvestmentLimit, hardcap, vestingSchedule, 0, 0, whitelist, { from: deployer });
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
