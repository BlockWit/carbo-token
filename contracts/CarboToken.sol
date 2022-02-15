// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./RecoverableFunds.sol";
import "./WithCallback.sol";
import "./interfaces/IDividendManager.sol";

contract CarboToken is IERC20, Ownable, RecoverableFunds, WithCallback {

    using SafeMath for uint256;

    struct Amounts {
        uint256 sum;
        uint256 transfer;
        uint256 rfi;
        uint256 dividends;
        uint256 buyback;
        uint256 treasury;
        uint256 liquidity;
    }

    struct Fees {
        uint256 rfi;
        uint256 dividends;
        uint256 buyback;
        uint256 treasury;
        uint256 liquidity;
    }

    enum FeeType { BUY, SELL, NONE}

    uint16 private constant PERCENT_RATE = 1000;
    uint256 private constant MAX = ~uint256(0);

    // -----------------------------------------------------------------------------------------------------------------
    // ERC20
    // -----------------------------------------------------------------------------------------------------------------

    mapping(address => mapping(address => uint256)) private _allowances;
    string private _name = "CLEANCARBON";
    string private _symbol = "CARBO";

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public pure returns (uint8) {
        return 18;
    }

    function totalSupply() external view override returns (uint256) {
        return _tTotal;
    }

    function balanceOf(address account) external view override returns (uint256) {
        if (_isExcluded[account]) return _tOwned[account];
        return tokenFromReflection(_rOwned[account]);
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        _transfer(sender, recipient, amount);
        uint256 currentAllowance = _allowances[sender][_msgSender()];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - amount);
        }
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        uint256 currentAllowance = _allowances[_msgSender()][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
    unchecked {
        _approve(_msgSender(), spender, currentAllowance - subtractedValue);
    }
        return true;
    }

    function _approve(address owner, address spender, uint256 amount) private {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    // -----------------------------------------------------------------------------------------------------------------
    // FEES
    // -----------------------------------------------------------------------------------------------------------------

    event FeeTaken(uint256 rfi, uint256 dividends, uint256 buyback, uint256 treasury, uint256 liquidity);

    Fees private _buyFees;
    Fees private _sellFees;
    address private _dividendsAddress;
    address private _buybackAddress;
    address private _treasuryAddress;
    address private _liquidityAddress;
    mapping(address => bool) private _isTaxable;
    mapping(address => bool) private _isExemptFromTaxation;

    function getFees() external view returns (Fees memory, Fees memory) {
        return (_buyFees, _sellFees);
    }

    function setFees(bool isBuy, uint rfi, uint dividends, uint buyback, uint treasury, uint liquidity) external onlyOwner {
        Fees memory fees = Fees(rfi, dividends, buyback, treasury, liquidity);
        if (isBuy) {
            _buyFees = fees;
        } else {
            _sellFees = fees;
        }
    }

    function getFeeAddresses() external view returns (address, address, address, address) {
        return (_dividendsAddress, _buybackAddress, _treasuryAddress, _liquidityAddress);
    }

    function setFeeAddresses(address dividends, address buyback, address treasury, address liquidity) external onlyOwner {
        _dividendsAddress = dividends;
        _buybackAddress = buyback;
        _treasuryAddress = treasury;
        _liquidityAddress = liquidity;
    }

    function setTaxable(address account, bool value) external onlyOwner {
        _isTaxable[account] = value;
    }

    function setExemptFromTaxation(address account, bool value) external onlyOwner {
        _isExemptFromTaxation[account] = value;
    }

    function _getFeeAmounts(uint256 amount, FeeType feeType) internal view returns (Fees memory) {
        Fees memory fees;
        if (feeType == FeeType.BUY) {
            fees = _buyFees;
        } else if (feeType == FeeType.SELL) {
            fees = _sellFees;
        }
        Fees memory feeAmounts;
        feeAmounts.rfi = amount.mul(fees.rfi).div(PERCENT_RATE);
        feeAmounts.dividends = amount.mul(fees.dividends).div(PERCENT_RATE);
        feeAmounts.buyback = amount.mul(fees.buyback).div(PERCENT_RATE);
        feeAmounts.treasury = amount.mul(fees.treasury).div(PERCENT_RATE);
        feeAmounts.liquidity = amount.mul(fees.liquidity).div(PERCENT_RATE);
        return feeAmounts;
    }

    function _getFeeType(address sender, address recipient) internal view returns (FeeType) {
        if (_isExemptFromTaxation[sender] || _isExemptFromTaxation[recipient]) return FeeType.NONE;
        if (_isTaxable[sender]) return FeeType.BUY;
        if (_isTaxable[recipient]) return FeeType.SELL;
        return FeeType.NONE;
    }

    // -----------------------------------------------------------------------------------------------------------------
    // RFI
    // -----------------------------------------------------------------------------------------------------------------

    uint256 private _tTotal = 500_000_000 ether;
    uint256 private _rTotal = (MAX - (MAX % _tTotal));
    uint256 private _tFeeTotal;
    mapping(address => uint256) private _rOwned;
    mapping(address => uint256) private _tOwned;
    mapping(address => bool) private _isExcluded;
    address[] private _excluded;

    constructor() {
        _rOwned[_msgSender()] = _rTotal;
        emit Transfer(address(0), _msgSender(), _tTotal);
    }

    function excludeFromRFI(address account) external onlyOwner {
        require(!_isExcluded[account], "Account is already excluded");
        if (_rOwned[account] > 0) {
            _tOwned[account] = tokenFromReflection(_rOwned[account]);
        }
        _isExcluded[account] = true;
        _excluded.push(account);
    }

    function includeInRFI(address account) external onlyOwner {
        require(_isExcluded[account], "Account is already included");
        for (uint256 i = 0; i < _excluded.length; i++) {
            if (_excluded[i] == account) {
                _excluded[i] = _excluded[_excluded.length - 1];
                _tOwned[account] = 0;
                _isExcluded[account] = false;
                _excluded.pop();
                break;
            }
        }
    }

    function reflect(uint256 tAmount) external {
        address sender = _msgSender();
        require(!_isExcluded[sender], "Excluded addresses cannot call this function");
        uint256 rAmount = _getRAmount(tAmount, _getRate());
        _rOwned[sender] = _rOwned[sender].sub(rAmount);
        _reflect(tAmount, rAmount);
    }

    function reflectionFromToken(uint256 tAmount) public view returns (uint256) {
        require(tAmount <= _tTotal, "Amount must be less than supply");
        return _getRAmount(tAmount, _getRate());
    }

    function tokenFromReflection(uint256 rAmount) public view returns (uint256) {
        require(rAmount <= _rTotal, "Amount must be less than total reflections");
        uint256 currentRate = _getRate();
        return rAmount.div(currentRate);
    }

    function _reflect(uint256 tAmount, uint256 rAmount) private {
        _rTotal = _rTotal.sub(rAmount);
        _tFeeTotal = _tFeeTotal.add(tAmount);
        _reflectCallback(tAmount, rAmount);
    }

    function _getCurrentSupply() private view returns (uint256, uint256) {
        uint256 rSupply = _rTotal;
        uint256 tSupply = _tTotal;
        for (uint256 i = 0; i < _excluded.length; i++) {
            if (_rOwned[_excluded[i]] > rSupply || _tOwned[_excluded[i]] > tSupply) return (_rTotal, _tTotal);
            rSupply = rSupply.sub(_rOwned[_excluded[i]]);
            tSupply = tSupply.sub(_tOwned[_excluded[i]]);
        }
        if (rSupply < _rTotal.div(_tTotal)) return (_rTotal, _tTotal);
        return (rSupply, tSupply);
    }

    function _getRate() private view returns (uint256) {
        (uint256 rSupply, uint256 tSupply) = _getCurrentSupply();
        return rSupply.div(tSupply);
    }

    function _getRAmount(uint256 tAmount, uint256 currentRate) private pure returns (uint256) {
        return tAmount.mul(currentRate);
    }

    function _getRAmounts(Amounts memory t, FeeType feeType, uint256 currentRate) private pure returns (Amounts memory) {
        Amounts memory r;
        r.sum = _getRAmount(t.sum, currentRate);
        r.transfer = r.sum;
        if (feeType != FeeType.NONE) {
            r.rfi = _getRAmount(t.rfi, currentRate);
            r.dividends = _getRAmount(t.dividends, currentRate);
            r.buyback = _getRAmount(t.buyback, currentRate);
            r.treasury = _getRAmount(t.treasury, currentRate);
            r.liquidity = _getRAmount(t.liquidity, currentRate);
            r.transfer = r.transfer.sub(r.rfi).sub(r.dividends).sub(r.buyback).sub(r.treasury).sub(r.liquidity);
        }
        return r;
    }

    function _getTAmounts(uint256 tAmount, FeeType feeType) private view returns (Amounts memory) {
        Amounts memory t;
        t.sum = tAmount;
        t.transfer = t.sum;
        if (feeType != FeeType.NONE) {
            Fees memory fees = _getFeeAmounts(tAmount, feeType);
            t.rfi = fees.rfi;
            t.dividends = fees.dividends;
            t.buyback = fees.buyback;
            t.treasury = fees.treasury;
            t.liquidity = fees.liquidity;
            t.transfer = t.transfer.sub(t.rfi).sub(t.dividends).sub(t.buyback).sub(t.treasury).sub(t.liquidity);
        }
        return t;
    }

    function _getAmounts(uint256 tAmount, FeeType feeType) private view returns (Amounts memory r, Amounts memory t) {
        t = _getTAmounts(tAmount, feeType);
        r = _getRAmounts(t, feeType, _getRate());
    }

    function _increaseBalance(address account, uint256 tAmount, uint256 rAmount) private {
        _rOwned[account] = _rOwned[account].add(rAmount);
        if (_isExcluded[account]) {
            _tOwned[account] = _tOwned[account].add(tAmount);
        }
    }

    function _decreaseBalance(address account, uint256 tAmount, uint256 rAmount) private {
        _rOwned[account] = _rOwned[account].sub(rAmount);
        if (_isExcluded[account]) {
            _tOwned[account] = _tOwned[account].sub(tAmount);
        }
    }

    function _transfer(address sender, address recipient, uint256 amount) internal virtual {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        (Amounts memory r, Amounts memory t) = _getAmounts(amount, _getFeeType(sender, recipient));
        require(_rOwned[sender] >= r.sum, "ERC20: transfer amount exceeds balance");
        _decreaseBalance(sender, t.sum, r.sum);
        _increaseBalance(recipient, t.transfer, r.transfer);
        emit Transfer(sender, recipient, t.transfer);
        if (t.sum != t.transfer) {
            if (t.rfi > 0) {
                _reflect(t.rfi, r.rfi);
            }
            if (t.dividends > 0) {
                _increaseBalance(_dividendsAddress, t.dividends, r.dividends);
            }
            if (t.buyback > 0) {
                _increaseBalance(_buybackAddress, t.buyback, r.buyback);
            }
            if (t.treasury > 0) {
                _increaseBalance(_treasuryAddress, t.treasury, r.treasury);
            }
            if (t.liquidity > 0) {
                _increaseBalance(_liquidityAddress, t.liquidity, r.liquidity);
            }
            emit FeeTaken(t.rfi, t.dividends, t.buyback, t.treasury, t.liquidity);
        }
        _transferCallback(sender, recipient, t.sum, t.transfer, r.sum, r.transfer);
    }

    // -----------------------------------------------------------------------------------------------------------------
    // DIVIDENDS
    // -----------------------------------------------------------------------------------------------------------------

    IDividendManager dividendManager;

    function setDividendManager(address _dividendManager) public onlyOwner {
        dividendManager = IDividendManager(_dividendManager);
        if (_dividendManager != address(0x0)) {
            dividendManager.setTotalSupply(_tTotal, _rTotal);
        }
    }

    function distributeDividends() public {
        dividendManager.distributeDividends();
    }

    function withdrawDividend() public {
        address account = _msgSender();
        dividendManager.withdrawDividend(account, _tOwned[account], _rOwned[account]);
    }

    function withdrawableDividendOf(address account) public view returns (uint256) {
        return dividendManager.withdrawableDividendOf(account, _tOwned[account], _rOwned[account]);
    }

    function withdrawnDividendOf(address account) public view returns (uint256) {
        return dividendManager.withdrawnDividendOf(account);
    }

    function accumulativeDividendOf(address account) public view returns (uint256) {
        return dividendManager.accumulativeDividendOf(account, _tOwned[account], _rOwned[account]);
    }

    function includeInDividends(address account) public onlyOwner {
        dividendManager.includeInDividends(account, _tOwned[account], _rOwned[account]);
    }

    function excludeFromDividends(address account) public onlyOwner {
        dividendManager.excludeFromDividends(account, _tOwned[account], _rOwned[account]);
    }

    function _reflectCallback(uint256 tAmount, uint256 rAmount) internal {
        if (address(dividendManager) != address(0x0)) {
            dividendManager.handleReflect(tAmount, rAmount);
        }
    }

    function _transferCallback(address from, address to, uint256 tFromAmount, uint256 tToAmount, uint256 rFromAmount, uint256 rToAmount) internal {
        if (address(dividendManager) != address(0x0)) {
            dividendManager.handleTransfer(from, to, tFromAmount, tToAmount, rFromAmount, rToAmount);
        }
    }

}
