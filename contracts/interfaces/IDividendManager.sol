// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

/**
 * @dev Interface of contract that can be invoked by a token contract during burning or transfer.
 */
interface IDividendManager {

    function handleTransfer(address sender, address recipient, uint256 amount) external;

}
