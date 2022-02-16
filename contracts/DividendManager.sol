pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/ICallbackContract.sol";
import "./interfaces/ICarboToken.sol";
import "./lib/ABDKMathQuad.sol";
import "./RecoverableFunds.sol";

contract DividendManager is ICallbackContract, Ownable, RecoverableFunds {

    ICarboToken public token;
    IERC20 public busd;

    bytes16 internal _totalSupply;
    bytes16 internal _dividendPerShare;
    mapping(address => bytes16) internal _dividendCorrections;
    mapping(address => uint256) internal _withdrawnDividends;
    mapping(address => bool) internal _excluded;

    event DividendsDistributed(address indexed from, uint256 amount);
    event DividendWithdrawn(address indexed to, uint256 amount);

    modifier onlyToken() {
        require(address(token) == _msgSender(), "DividendManager: caller is not the token");
        _;
    }

    function setToken(address _token) public onlyOwner {
        token = ICarboToken(_token);
        _totalSupply = ABDKMathQuad.fromUInt(token.getRTotal());
    }

    function setBUSD(address _busd) public onlyOwner {
        busd = IERC20(_busd);
    }

    function totalSupply() public view returns(uint256)  {
        return ABDKMathQuad.toUInt(_totalSupply);
    }

    function dividendCorrectionOf(address account) public view returns(uint256)  {
        return ABDKMathQuad.toUInt(_dividendCorrections[account]);
    }

    function dividendPerShare() public view returns(uint256)  {
        return ABDKMathQuad.toUInt(_dividendPerShare);
    }

    function distributeDividends() public {
        require(ABDKMathQuad.sign(_totalSupply) > 0, "DividendManager: totalSupply should be greater than 0");
        uint256 value = busd.balanceOf(address(this));
        require(value > 0, "DividendManager: distributed amount should be greater than 0");
        _dividendPerShare = ABDKMathQuad.add(
            _dividendPerShare,
            ABDKMathQuad.div(
                ABDKMathQuad.fromUInt(value),
                    _totalSupply
            )
        );
        emit DividendsDistributed(msg.sender, value);
    }

    function withdrawDividend() public {
        _withdrawDividend(_msgSender());
    }

    function withdrawableDividendOf(address account) public view returns(uint256) {
        return accumulativeDividendOf(account) - _withdrawnDividends[account];
    }

    function withdrawnDividendOf(address account) public view returns(uint256) {
        return _withdrawnDividends[account];
    }

    function accumulativeDividendOf(address account) public view returns(uint256) {
        return ABDKMathQuad.toUInt(
            ABDKMathQuad.add(
                ABDKMathQuad.mul(_dividendPerShare, ABDKMathQuad.fromUInt(token.getROwned(account))),
                _dividendCorrections[account]
            )
        );
    }

    function includeInDividends(address account) public onlyOwner {
        _dividendCorrections[account] = ABDKMathQuad.neg(
            ABDKMathQuad.mul(
                _dividendPerShare,
                ABDKMathQuad.fromUInt(token.getROwned(account))
            )
        );
        _excluded[account] = false;
        ABDKMathQuad.add(_totalSupply, ABDKMathQuad.fromUInt(token.getROwned(account)));
    }

    function excludeFromDividends(address account) public onlyOwner {
        _withdrawDividend(account);
        _excluded[account] = true;
        ABDKMathQuad.sub(_totalSupply, ABDKMathQuad.fromUInt(token.getROwned(account)));
    }

    function reflectCallback(uint256 tAmount, uint256 rAmount) override external onlyToken {
        _totalSupply = ABDKMathQuad.sub(_totalSupply, ABDKMathQuad.fromUInt(rAmount));
    }

    function increaseBalanceCallback(address account, uint256 tAmount, uint256 rAmount) override external onlyToken {
        bytes16 value = ABDKMathQuad.fromUInt(rAmount);
        if (_excluded[account]) {
            _totalSupply = ABDKMathQuad.sub(_totalSupply, value);
        } else {
            _decreaseDividendCorrection(account, _calculateDividendCorrection(value));
        }
    }

    function decreaseBalanceCallback(address account, uint256 tAmount, uint256 rAmount) override external onlyToken {
        bytes16 value = ABDKMathQuad.fromUInt(rAmount);
        if (_excluded[account]) {
            _totalSupply = ABDKMathQuad.add(_totalSupply, value);
        } else {
            _increaseDividendCorrection(account, _calculateDividendCorrection(value));
        }
    }

    function transferCallback(address from, address to, uint256 tFromAmount, uint256 rFromAmount, uint256 tToAmount, uint256 rToAmount) override external onlyToken {}

    function _withdrawDividend(address account) internal {
        uint256 withdrawableDividend = withdrawableDividendOf(account);
        if (withdrawableDividend > 0) {
            _withdrawnDividends[account] = _withdrawnDividends[account] + withdrawableDividend;
            busd.transfer(account, withdrawableDividend);
            emit DividendWithdrawn(account, withdrawableDividend);
        }
    }

    function _calculateDividendCorrection(bytes16 value) internal view returns (bytes16) {
        return ABDKMathQuad.mul(_dividendPerShare, value);
    }

    function _increaseDividendCorrection(address account, bytes16 value) internal {
        _dividendCorrections[account] = ABDKMathQuad.add(_dividendCorrections[account], value);
    }

    function _decreaseDividendCorrection(address account, bytes16 value) internal {
        _dividendCorrections[account] = ABDKMathQuad.sub(_dividendCorrections[account], value);
    }

}
