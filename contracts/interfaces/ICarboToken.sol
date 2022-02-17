// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

/**
 * @dev Interface of CarboToken
 */
interface ICarboToken {

    struct Fees {
        uint256 rfi;
        uint256 dividends;
        uint256 buyback;
        uint256 treasury;
        uint256 liquidity;
    }

    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function getROwned(address account) external view returns (uint256);
    function getRTotal() external view returns (uint256);
    function getFees() external view returns (Fees memory, Fees memory);

}
