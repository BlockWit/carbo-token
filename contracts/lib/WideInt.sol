// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;


library WideInt {

    struct int512 {
        uint256 r0;
        uint256 r1;
        bool isPositive;
    }

    function toInt512(uint256 a) internal returns (int512 memory) {
        return int512(a, 0, true);
    }

    function toInt512(int256 a) internal returns (int512 memory) {
        if (a < 0) return int512(uint256(-a), 0, false);
        else return int512(uint256(a), 0, true);
    }

    function toInt256(int512 memory a) internal returns (uint256) {
        require(a.isPositive, "FullMath: Could not convert negative int512 to uint256");
        require(a.r1 == 0, "FullMath: Could not convert int512 > 2^256 to uint256");
        return a.r0;
    }

    function add(int512 memory a, int512 memory b) internal returns (int512 memory) {
        uint256 r0;
        uint256 r1;
        bool isPositive = true;
        if (a.isPositive && b.isPositive) {
            (r0, r1) = _add(a, b);
        } else if (!a.isPositive && !b.isPositive) {
            (r0, r1) = _add(a, b);
            isPositive = false;
        } else if (a.isPositive && !b.isPositive) {
            if (_gt(a, b)) {
                (r0, r1) = _sub(a, b);
            } else {
                (r0, r1) = _sub(b, a);
                isPositive = false;
            }
        } else if (!a.isPositive && b.isPositive) {
            if (_gt(a, b)) {
                (r0, r1) = _sub(a, b);
                isPositive = false;
            } else {
                (r0, r1) = _sub(b, a);
            }
        }
        return int512(r0, r1, isPositive);
    }

    function sub(int512 memory a, int512 memory b) internal returns (int512 memory) {
        return add(a, int512(b.r0, b.r1, !b.isPositive));
    }

    function div(int512 memory a, uint256 denominator) internal returns (uint256) {
        require(a.isPositive);
        return _div(a.r0, a.r1, denominator);
    }

    function _gt(int512 memory x, int512 memory y) internal pure returns (bool) {
        return x.r1 > y.r1 || (x.r1 == y.r1 && x.r0 > y.r0);
    }

    function _mul(uint256 a, uint256 b) internal pure returns (uint256 r0, uint256 r1) {
        assembly {
            let mm := mulmod(a, b, not(0))
            r0 := mul(a,b)
            r1 := sub(sub(mm, r0), lt(mm, r0))
        }
    }

    function _add(int512 memory a, int512 memory b) internal pure returns (uint256 r0, uint256 r1) {
        (r0, r1) = _add(a.r0, a.r1, b.r0, b.r1);
    }

    function _add(uint256 a0, uint256 a1, uint256 b0, uint256 b1) internal pure returns (uint256 r0, uint256 r1) {
        assembly {
            r0 := add(a0, b0)
            r1 := add(add(a1, b1), lt(r0, a0))
        }
    }

    function _sub(int512 memory a, int512 memory b) internal pure returns (uint256 r0, uint256 r1) {
        (r0, r1) = _sub(a.r0, a.r1, b.r0, b.r1);
    }

    function _sub(uint256 a0, uint256 a1, uint256 b0, uint256 b1) internal pure returns (uint256 r0, uint256 r1) {
        assembly {
            r0 := sub(a0, b0)
            r1 := sub(sub(a1, b1), lt(a0, b0))
        }
    }

    function _div(uint256 a0, uint256 a1, uint256 denominator) {
        // Handle non-overflow cases, 256 by 256 division
        if (a1 == 0) {
            require(denominator > 0, "FullMath: denominator should be greater than zero ");
            assembly {
                result := div(prod0, denominator)
            }
            return result;
        }

        // Make sure the result is less than 2**256.
        // Also prevents denominator == 0
        require(denominator > a1);

        ///////////////////////////////////////////////
        // 512 by 256 division.
        ///////////////////////////////////////////////

        // Make division exact by subtracting the remainder from [prod1 prod0]
        // Compute remainder using mulmod
        uint256 remainder;
        assembly {
            remainder := mulmod(a, b, denominator)
        }
        // Subtract 256 bit number from 512 bit number
        assembly {
            prod1 := sub(prod1, gt(remainder, prod0))
            prod0 := sub(prod0, remainder)
        }

        // Factor powers of two out of denominator
        // Compute largest power of two divisor of denominator.
        // Always >= 1.
        uint256 twos = (~denominator + 1) & denominator;
        // Divide denominator by power of two
        assembly {
            denominator := div(denominator, twos)
        }

        // Divide [prod1 prod0] by the factors of two
        assembly {
            prod0 := div(prod0, twos)
        }
        // Shift in bits from prod1 into prod0. For this we need
        // to flip `twos` such that it is 2**256 / twos.
        // If twos is zero, then it becomes one
        assembly {
            twos := add(div(sub(0, twos), twos), 1)
            prod0 := add(prod0, mul(prod1, twos))
        }

        // Invert denominator mod 2**256
        // Now that denominator is an odd number, it has an inverse
        // modulo 2**256 such that denominator * inv = 1 mod 2**256.
        // Compute the inverse by starting with a seed that is correct
        // correct for four bits. That is, denominator * inv = 1 mod 2**4
        uint256 inv = (3 * denominator) ^ 2;
        // Now use Newton-Raphson iteration to improve the precision.
        // Thanks to Hensel's lifting lemma, this also works in modular
        // arithmetic, doubling the correct bits in each step.
        assembly {
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**8
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**16
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**32
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**64
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**128
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**256

        // Because the division is now exact we can divide by multiplying
        // with the modular inverse of denominator. This will give us the
        // correct result modulo 2**256. Since the precoditions guarantee
        // that the outcome is less than 2**256, this is the final result.
        // We don't need to compute the high bits of the result and prod1
        // is no longer required.
            result := mul(prod0, inv)
        }

        return result;
    }

    function _muldiv(uint256 a, uint256 b, uint256 denominator) internal pure returns (uint256 result) {
        // 512-bit multiply [prod1 prod0] = a * b
        // Compute the product mod 2**256 and mod 2**256 - 1
        // then use the Chinese Remainder Theorem to reconstruct
        // the 512 bit result. The result is stored in two 256
        // variables such that product = prod1 * 2**256 + prod0
        uint256 prod0; // Least significant 256 bits of the product
        uint256 prod1; // Most significant 256 bits of the product
        assembly {
            let mm := mulmod(a, b, not(0))
            prod0 := mul(a, b)
            prod1 := sub(sub(mm, prod0), lt(mm, prod0))
        }

        // Handle non-overflow cases, 256 by 256 division
        if (prod1 == 0) {
            require(denominator > 0, "FullMath: denominator should be greater than zero ");
            assembly {
                result := div(prod0, denominator)
            }
            return result;
        }

        // Make sure the result is less than 2**256.
        // Also prevents denominator == 0
        require(denominator > prod1);

        ///////////////////////////////////////////////
        // 512 by 256 division.
        ///////////////////////////////////////////////

        // Make division exact by subtracting the remainder from [prod1 prod0]
        // Compute remainder using mulmod
        uint256 remainder;
        assembly {
            remainder := mulmod(a, b, denominator)
        }
        // Subtract 256 bit number from 512 bit number
        assembly {
            prod1 := sub(prod1, gt(remainder, prod0))
            prod0 := sub(prod0, remainder)
        }

        // Factor powers of two out of denominator
        // Compute largest power of two divisor of denominator.
        // Always >= 1.
        uint256 twos = (~denominator + 1) & denominator;
        // Divide denominator by power of two
        assembly {
            denominator := div(denominator, twos)
        }

        // Divide [prod1 prod0] by the factors of two
        assembly {
            prod0 := div(prod0, twos)
        }
        // Shift in bits from prod1 into prod0. For this we need
        // to flip `twos` such that it is 2**256 / twos.
        // If twos is zero, then it becomes one
        assembly {
            twos := add(div(sub(0, twos), twos), 1)
            prod0 := add(prod0, mul(prod1, twos))
        }

        // Invert denominator mod 2**256
        // Now that denominator is an odd number, it has an inverse
        // modulo 2**256 such that denominator * inv = 1 mod 2**256.
        // Compute the inverse by starting with a seed that is correct
        // correct for four bits. That is, denominator * inv = 1 mod 2**4
        uint256 inv = (3 * denominator) ^ 2;
        // Now use Newton-Raphson iteration to improve the precision.
        // Thanks to Hensel's lifting lemma, this also works in modular
        // arithmetic, doubling the correct bits in each step.
        assembly {
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**8
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**16
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**32
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**64
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**128
            inv := mul(inv, sub(2, mul(denominator, inv))) // inverse mod 2**256

        // Because the division is now exact we can divide by multiplying
        // with the modular inverse of denominator. This will give us the
        // correct result modulo 2**256. Since the precoditions guarantee
        // that the outcome is less than 2**256, this is the final result.
        // We don't need to compute the high bits of the result and prod1
        // is no longer required.
            result := mul(prod0, inv)
        }

        return result;
    }

}
