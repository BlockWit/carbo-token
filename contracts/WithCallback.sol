// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICallbackContract.sol";

/**
 * @dev Allows the owner to register a callback contract that will be called after every call of the transfer or burn function
 */
contract WithCallback is Ownable {

    address public callback = address(0x0);

    function setCallback(address _callback) external onlyOwner {
        callback = _callback;
    }

    function _reflectCallback(uint256 tAmount, uint256 rAmount) internal {
        if (callback != address(0x0)) {
            ICallbackContract(callback).reflectCallback(tAmount, rAmount);
        }
    }

    function _increaseBalanceCallback(address account, uint256 tAmount, uint256 rAmount) internal {
        if (callback != address(0x0)) {
            ICallbackContract(callback).increaseBalanceCallback(account, tAmount, rAmount);
        }
    }

    function _decreaseBalanceCallback(address account, uint256 tAmount, uint256 rAmount) internal {
        if (callback != address(0x0)) {
            ICallbackContract(callback).decreaseBalanceCallback(account, tAmount, rAmount);
        }
    }

    function _decreaseTotalSupplyCallback(uint256 tAmount, uint256 rAmount) internal {
        if (callback != address(0x0)) {
            ICallbackContract(callback).decreaseTotalSupplyCallback(tAmount, rAmount);
        }
    }

    function _transferCallback(address from, address to, uint256 tFromAmount, uint256 rFromAmount, uint256 tToAmount, uint256 rToAmount) internal {
        if (callback != address(0x0)) {
            ICallbackContract(callback).transferCallback(from, to, tFromAmount, rFromAmount, tToAmount, rToAmount);
        }
    }

}

