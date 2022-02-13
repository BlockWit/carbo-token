pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./lib/SafeMathUint.sol";
import "./lib/SafeMathInt.sol";
import "./interfaces/IDividendManager.sol";
import "./RecoverableFunds.sol";

contract DividendManager is IDividendManager, Ownable, RecoverableFunds {
    using SafeMath for uint256;
    using SafeMathUint for uint256;
    using SafeMathInt for int256;

    event DividendsDistributed(address indexed from, uint256 weiAmount);
    event DividendWithdrawn(address indexed to, uint256 weiAmount);

    ERC20 public token;
    address public master;
    uint256 public totalSupply;
    uint256 constant internal magnitude = 2**128;
    uint256 internal magnifiedDividendPerShare;
    mapping(address => int256) internal magnifiedDividendCorrections;
    mapping(address => uint256) internal withdrawnDividends;
    mapping(address => bool) internal excluded;

    modifier onlyMaster() {
        require(master == _msgSender(), "DividendManager: caller is not the master");
        _;
    }

    function setToken(address _token) public override onlyOwner {
        token = ERC20(_token);
    }

    function setMaster(address _master) public override onlyOwner {
        master = _master;
    }

    function setTotalSupply(uint256 tTotal, uint256 rTotal) public override onlyOwner {
        totalSupply = rTotal;
    }

    function distributeDividends() public override {
        require(totalSupply > 0);
        uint256 value = token.balanceOf(address(this));
        if (value > 0) {
            magnifiedDividendPerShare = magnifiedDividendPerShare.add(
                value.mul(magnitude) / totalSupply
            );
            emit DividendsDistributed(msg.sender, value);
        }
    }

    function withdrawDividend(address account, uint256 tOwned, uint256 rOwned) public override onlyMaster {
        uint256 _withdrawableDividend = withdrawableDividendOf(account, tOwned, rOwned);
        if (_withdrawableDividend > 0) {
            withdrawnDividends[account] = withdrawnDividends[account].add(_withdrawableDividend);
            emit DividendWithdrawn(account, _withdrawableDividend);
            token.transfer(account, _withdrawableDividend);
        }
    }

    function withdrawableDividendOf(address account, uint256 tOwned, uint256 rOwned) public view override returns(uint256) {
        return accumulativeDividendOf(account, tOwned, rOwned).sub(withdrawnDividends[account]);
    }

    function withdrawnDividendOf(address account) public view override returns(uint256) {
        return withdrawnDividends[account];
    }

    function accumulativeDividendOf(address account, uint256 tOwned, uint256 rOwned) public view override returns(uint256) {
        return magnifiedDividendPerShare
        .mul(rOwned)
        .toInt256Safe()
        .add(magnifiedDividendCorrections[account])
        .toUint256Safe()
        .div(magnitude);
    }

    function includeInDividends(address account, uint256 tOwned, uint256 rOwned) public override onlyMaster {
        magnifiedDividendCorrections[account] = -magnifiedDividendPerShare.mul(rOwned).toInt256Safe();
        excluded[account] = false;
    }

    function excludeFromDividends(address account, uint256 tOwned, uint256 rOwned) public override onlyMaster {
        withdrawDividend(account, tOwned, rOwned);
        excluded[account] = true;
    }

    function handleTransfer(address from, address to, uint256 tFromAmount, uint256 tToAmount, uint256 rFromAmount, uint256 rToAmount) public override onlyMaster {
        if (!excluded[from] && !excluded[to]) {
            _transfer(from, to, rFromAmount, rToAmount);
        }
        if (excluded[from] && !excluded[to]) {
            _mint(to, rToAmount);
        }
        if (!excluded[from] && excluded[to]) {
            _burn(from, rFromAmount);
        }
    }

    function handleReflect(uint256 tAmount, uint256 rAmount) public override onlyMaster {
        totalSupply -= rAmount;
    }

    function _mint(address account, uint256 amount) internal {
        totalSupply += amount;
        _calculateAndDecreaseDividendCorrection(account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        totalSupply -= amount;
        _calculateAndIncreaseDividendCorrection(account, amount);
    }

    function _transfer(address sender, address recipient, uint256 fromAmount, uint256 toAmount) internal {
        _calculateAndIncreaseDividendCorrection(sender, fromAmount);
        _calculateAndDecreaseDividendCorrection(recipient, toAmount);
    }

    function _calculateDividendCorrection(uint256 value) internal view returns (int256) {
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

}
