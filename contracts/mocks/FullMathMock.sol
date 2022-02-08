// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../FullMath.sol";

contract FullmathMock {

    function mul(uint256 a, uint256 b) public pure returns (uint256 r0, uint256 r1) {
       return FullMath.mul(a, b);
    }

    function inv(uint256 a) public pure returns (uint256 r) {
        return FullMath.inv(a);
    }

    function add(uint256 a0, uint256 a1, uint256 b0, uint256 b1) public pure returns (uint256 r0, uint256 r1) {
        return FullMath.add(a0, a1, b0, b1);
    }

    function sub(uint256 a0, uint256 a1, uint256 b0, uint256 b1) public pure returns (uint256 r0, uint256 r1) {
        return FullMath.sub(a0, a1, b0, b1);
    }

    function muldiv(uint256 a, uint256 b, uint256 denominator) public pure returns (uint256 result) {
        return FullMath.muldiv(a, b, denominator);
    }

}
