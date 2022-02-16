// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

/**
 * @dev Interface of CarboToken
 */
interface ICarboToken {

    function getROwned(address account) external view returns(uint256);
    function getRTotal() external view returns(uint256);

}
