// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

/**
 * @dev Interface of contract that can be invoked by a token contract during burning or transfer.
 */
interface IDividendManager {

    function setToken(address token) external;

    function setMaster(address master) external;

    function setTotalSupply(uint256 tTotal, uint256 rTotal) external;

    function distributeDividends() external;

    function withdrawDividend(address account, uint256 tOwned, uint256 rOwned) external;

    function withdrawableDividendOf(address account, uint256 tOwned, uint256 rOwned) external view returns (uint256);

    function withdrawnDividendOf(address account) external view returns (uint256);

    function accumulativeDividendOf(address account, uint256 tOwned, uint256 rOwned) external view returns (uint256);

    function includeInDividends(address account, uint256 tOwned, uint256 rOwned) external;

    function excludeFromDividends(address account, uint256 tOwned, uint256 rOwned) external;

    function handleTransfer(address from, address to, uint256 tFromAmount, uint256 tToAmount, uint256 rFromAmount, uint256 rToAmount) external;

    function handleReflect(uint256 tAmount, uint256 rAmount) external;

}
