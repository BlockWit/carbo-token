pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./lib/SafeMathUint.sol";
import "./lib/SafeMathInt.sol";
import "./lib/ABDKMathQuad.sol";
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
    bytes16 public totalSupply;
    bytes16 public dividendPerShare;
    mapping(address => bytes16) internal dividendCorrections;
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
        totalSupply = ABDKMathQuad.fromUInt(rTotal);
    }

    function getTotalSupply() public view returns(uint256)  {
        return ABDKMathQuad.toUInt(totalSupply);
    }

    function dividendCorrectionOf(address account) public view returns(uint256)  {
        return ABDKMathQuad.toUInt(dividendCorrections[account]);
    }

    function getDividendPerShare() public view returns(uint256)  {
        return ABDKMathQuad.toUInt(dividendPerShare);
    }

    function distributeDividends() public override {
        require(ABDKMathQuad.sign(totalSupply) > 0, "DividendManager: totalSupply should be greater than 0");
        uint256 value = token.balanceOf(address(this));
        if (value > 0) {
            dividendPerShare = ABDKMathQuad.add(
                dividendPerShare,
                ABDKMathQuad.div(
                    ABDKMathQuad.fromUInt(value),
                    totalSupply
                )
            );
            emit DividendsDistributed(msg.sender, value);
        }
    }

    function withdrawDividend(address account, uint256 tOwned, uint256 rOwned) public override onlyMaster {
        uint256 withdrawableDividend = withdrawableDividendOf(account, tOwned, rOwned);
        if (withdrawableDividend > 0) {
            withdrawnDividends[account] = withdrawnDividends[account].add(withdrawableDividend);
            emit DividendWithdrawn(account, withdrawableDividend);
            token.transfer(account, withdrawableDividend);
        }
    }

    function withdrawableDividendOf(address account, uint256 tOwned, uint256 rOwned) public view override returns(uint256) {
        return accumulativeDividendOf(account, tOwned, rOwned).sub(withdrawnDividends[account]);
    }

    function withdrawnDividendOf(address account) public view override returns(uint256) {
        return withdrawnDividends[account];
    }

    function accumulativeDividendOf(address account, uint256 tOwned, uint256 rOwned) public view override returns(uint256) {
        return ABDKMathQuad.toUInt(
            ABDKMathQuad.add(
                ABDKMathQuad.mul(dividendPerShare, ABDKMathQuad.fromUInt(rOwned)),
                dividendCorrections[account]
            )
        );
    }

    function includeInDividends(address account, uint256 tOwned, uint256 rOwned) public override onlyMaster {
        dividendCorrections[account] = ABDKMathQuad.neg(
            ABDKMathQuad.mul(
                dividendPerShare,
                ABDKMathQuad.fromUInt(rOwned)
            )
        );
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
        totalSupply = ABDKMathQuad.sub(totalSupply, ABDKMathQuad.fromUInt(rAmount));
    }

    function _mint(address account, uint256 amount) internal {
        bytes16 value = ABDKMathQuad.fromUInt(amount);
        totalSupply = ABDKMathQuad.add(totalSupply, value);
        _increaseDividendCorrection(account, _calculateDividendCorrection(value));
    }

    function _burn(address account, uint256 amount) internal {
        bytes16 value = ABDKMathQuad.fromUInt(amount);
        totalSupply = ABDKMathQuad.sub(totalSupply, value);
        _increaseDividendCorrection(account, _calculateDividendCorrection(value));
    }

    function _transfer(address sender, address recipient, uint256 fromAmount, uint256 toAmount) internal {
        if (fromAmount == toAmount) {
            bytes16 dividendCorrection = _calculateDividendCorrection(ABDKMathQuad.fromUInt(fromAmount));
            _increaseDividendCorrection(sender, dividendCorrection);
            _decreaseDividendCorrection(recipient, dividendCorrection);
        } else {
            _increaseDividendCorrection(sender, _calculateDividendCorrection(ABDKMathQuad.fromUInt(fromAmount)));
            _decreaseDividendCorrection(recipient, _calculateDividendCorrection(ABDKMathQuad.fromUInt(toAmount)));
        }
    }

    function _calculateDividendCorrection(bytes16 value) internal view returns (bytes16) {
        return ABDKMathQuad.mul(dividendPerShare, value);
    }

    function _increaseDividendCorrection(address account, bytes16 value) internal {
        dividendCorrections[account] = ABDKMathQuad.add(dividendCorrections[account], value);
    }

    function _decreaseDividendCorrection(address account, bytes16 value) internal {
        dividendCorrections[account] = ABDKMathQuad.sub(dividendCorrections[account], value);
    }

}
