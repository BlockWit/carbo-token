pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./lib/SafeMathUint.sol";
import "./lib/SafeMathInt.sol";

contract DividendManager is Ownable {
    using SafeMath for uint256;
    using SafeMathUint for uint256;
    using SafeMathInt for int256;

    event DividendsDistributed(address indexed from, uint256 weiAmount);
    event DividendWithdrawn(address indexed to, uint256 weiAmount);

    ERC20 public token;
    uint256 constant internal magnitude = 2**128;
    uint256 internal magnifiedDividendPerShare;
    mapping(address => int256) internal magnifiedDividendCorrections;
    mapping(address => uint256) internal withdrawnDividends;
    mapping(address => bool) internal excluded;

    constructor(address initialAccount, uint256 initialBalance) {
        _mint(initialAccount, initialBalance);
    }

    function setToken(address _token) public onlyOwner {
        token = ERC20(_token);
    }

    function distributeDividends() public {
        require(totalSupply() > 0);
        uint256 value = token.balanceOf(address(this));
        if (value > 0) {
            magnifiedDividendPerShare = magnifiedDividendPerShare.add(
                value.mul(magnitude) / totalSupply()
            );
            emit DividendsDistributed(msg.sender, value);
        }
    }

    function withdrawDividend() public {
        uint256 _withdrawableDividend = withdrawableDividendOf(msg.sender);
        if (_withdrawableDividend > 0) {
            withdrawnDividends[msg.sender] = withdrawnDividends[msg.sender].add(_withdrawableDividend);
            emit DividendWithdrawn(msg.sender, _withdrawableDividend);
            token.transfer(msg.sender, _withdrawableDividend);
        }
    }

    function withdrawableDividendOf(address _owner) public view returns(uint256) {
        return accumulativeDividendOf(_owner).sub(withdrawnDividends[_owner]);
    }

    function withdrawnDividendOf(address _owner) public view returns(uint256) {
        return withdrawnDividends[_owner];
    }

    function accumulativeDividendOf(address _owner) public view returns(uint256) {
        return magnifiedDividendPerShare.mul(balanceOf(_owner)).toInt256Safe()
        .add(magnifiedDividendCorrections[_owner]).toUint256Safe() / magnitude;
    }

    function includeInDividends(address account) public onlyOwner {
        excluded[account] = false;
        _calculateAndDecreaseDividendCorrection(account, balanceOf(account));
    }

    function excludeFromDividends(address account) public onlyOwner {
        excluded[account] = true;
        _calculateAndIncreaseDividendCorrection(account, balanceOf(account));
    }

    function handleTransfer(address from, address to, uint256 value) external onlyOwner {
        _transfer(from, to, value);
        int256 _magCorrection = _calculateDividendCorrection(value);
        if (excluded[from]) {
            _totalSupply += value;
        }
        if (excluded[to]) {
            _totalSupply -= value;
        }
        _increaseDividendCorrection(from, _magCorrection);
        _decreaseDividendCorrection(to, _magCorrection);
    }

    function _mint(address account, uint256 amount) internal {
        _totalSupply += amount;
        _balances[account] += amount;
        _calculateAndDecreaseDividendCorrection(account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        uint256 accountBalance = _balances[account];
        _balances[account] = accountBalance - amount;
        _totalSupply -= amount;
        _calculateAndIncreaseDividendCorrection(account, amount);
    }

    function _calculateDividendCorrection(uint256 value) internal pure returns (int256) {
        return magnifiedDividendPerShare.mul(value).toInt256Safe();
    }

    function _increaseDividendCorrection(address account, int256 value) internal {
        magnifiedDividendCorrections[account] = magnifiedDividendCorrections[account].add(value);
    }

    function _decreaseDividendCorrection(address account, int256 value) internal {
        magnifiedDividendCorrections[account] = magnifiedDividendCorrections[account].sub(value);
    }

    function _calculateAndIncreaseDividendCorrection(address account, uint256 value) internal {
        _increaseDividendCorrection(account, _calculateDividendCorrection(value));
    }

    function _calculateAndDecreaseDividendCorrection(address account, uint256 value) internal {
        _decreaseDividendCorrection(account, _calculateDividendCorrection(value));
    }

    //------------------------------------------------------------------------------------------------------------------
    // ERC20
    //------------------------------------------------------------------------------------------------------------------

    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        uint256 senderBalance = _balances[sender];
        _balances[sender] = senderBalance - amount;
        _balances[recipient] += amount;
    }

}
