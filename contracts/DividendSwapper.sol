// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./interfaces/IDividendManager.sol";
import "./RecoverableFunds.sol";

contract DividendSwapper is Ownable, RecoverableFunds {

    IUniswapV2Router02 public uniswapRouter;
    IDividendManager public dividendManager;
    IERC20 public carbo;
    IERC20 public busd;

    constructor(address _router, address _busd, address _carbo) {
        carbo = IERC20(_carbo);
        busd = IERC20(_busd);
        uniswapRouter = IUniswapV2Router02(_router);
    }

    function swapAndDistribute() external {
        uint256 amount = carbo.balanceOf(address(this));
        require(amount > 0, "DividendSwapper: amount should be greater than 0");
        swap(amount);
        uint256 dividends = busd.balanceOf(address(this));
        bool success = busd.transfer(address(dividendManager), dividends);
        if (success) {
            dividendManager.distributeDividends();
        }
    }

    function swap(uint256 amount) internal {
        address[] memory path = new address[](3);
        path[0] = address(this);
        path[1] = address(carbo);
        path[2] = address(busd);

        carbo.approve(address(uniswapRouter), amount);

        uniswapRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amount,
            0,
            path,
            address(this),
            block.timestamp
        );
    }

}

