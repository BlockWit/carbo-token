const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Token = contract.fromArtifact('CARBOToken');
const TokenDepositor = contract.fromArtifact('TokenDepositor');
const VestingWallet = contract.fromArtifact('VestingWallet');

const [owner, manager, ...addresses] = accounts;
const SUPPLY = ether('1000000000');

describe('VestingWallet', async () => {
  let depositor;
  let token;
  let wallet;

  beforeEach(async () => {
    const DAY_0 = await time.latest();
    /* eslint-disable no-multi-spaces */
    const VESTING_SCHEDULES = [
      { id: 0,  start: DAY_0,                                     duration: time.duration.days('0'),   interval: time.duration.days('0')  },
      { id: 1,  start: DAY_0.add(time.duration.days('150')),  duration: time.duration.days('360'), interval: time.duration.days('30') }, // round A
      { id: 2,  start: DAY_0.add(time.duration.days('60')),   duration: time.duration.days('360'), interval: time.duration.days('30') }, // round B
      { id: 3,  start: DAY_0.add(time.duration.days('60')),   duration: time.duration.days('450'), interval: time.duration.days('30') }, // round C
      { id: 4,  start: DAY_0.add(time.duration.days('150')),  duration: time.duration.days('360'), interval: time.duration.days('30') }  // round D
    ];
    /* eslint-enable no-multi-spaces */
    depositor = await TokenDepositor.new({ from: owner });
    token = await Token.new([depositor.address], [SUPPLY], { from: owner });
    wallet = await VestingWallet.new({ from: owner });
    await Promise.all([
      wallet.setToken(token.address, { from: owner }),
      depositor.setToken(token.address, { from: owner }),
      depositor.setVestingWallet(wallet.address, { from: owner })
    ]);
    await Promise.all(VESTING_SCHEDULES.map(({ id, start, duration, interval }) =>
      wallet.setVestingSchedule(id, start, duration, interval, { from: owner })
    ));
  });

  describe('deposit', () => {
    const chunks = [];
    while (addresses.length > 0) {
      const chunk = addresses.splice(0, 2);
      chunks.push(chunk);
    }
    const groups = chunks.map((group, i) => {
      return {
        unlocked: i === 1 ? 5 : i === 2 ? 10 : 0,
        schedule: i + 1,
        addresses: group,
        balances: group.map(_ => ether((Math.random() * 100).toString()))
      };
    });
    groups.forEach(({ unlocked, schedule, addresses, balances }, i) => {
      console.log(`group #${i}. unlocked: ${unlocked}. schedule: ${schedule}`);
      addresses.forEach((address, j) => console.log(address, balances[j].toString()));
    });
    it('should distribute tokens correctly', async () => {
      for (const { unlocked, schedule, addresses, balances } of groups) {
        await depositor.deposit(unlocked, schedule, addresses, balances, { from: owner });
      }
      for (const { unlocked, schedule, addresses, balances } of groups) {
        await Promise.all(addresses.map(async (address, i) => {
          const { 0: initial1, 1: withdrawn1, 2: vested1 } = await wallet.getAccountInfo(address);
          expect(initial1).to.be.bignumber.equal(balances[i]);
          expect(withdrawn1).to.be.bignumber.equal(new BN('0'));
          expect(vested1).to.be.bignumber.equal(balances[i].muln(unlocked).divn(100));
          if (schedule === 2 || schedule === 3) {
            await wallet.withdraw({ from: address });
            const balance = await token.balanceOf(address);
            const { 0: initial2, 1: withdrawn2, 2: vested2 } = await wallet.getAccountInfo(address);
            expect(initial2).to.be.bignumber.equal(initial1);
            expect(balance).to.be.bignumber.equal(vested1).and.equal(withdrawn2);
            expect(vested2).to.be.bignumber.equal(new BN('0'));
          } else {
            await expectRevert(wallet.withdraw({ from: address }), 'VestingWallet: No tokens available for withdrawal');
          }
        }));
      }
    });
  });
});
