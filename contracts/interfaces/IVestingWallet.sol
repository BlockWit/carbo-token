// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

/**
 * @dev Interface of MultiWallet contract.
 */
interface IVestingWallet {

    function deposit(uint256 schedule, address beneficiary, uint256 amount) external;
    function deposit(uint256 schedule, address[] calldata beneficiaries, uint256[] calldata amounts) external;

}
