// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStaking {
    function hasDiscount(address user) external view returns (bool);
    function discountPercent() external view returns (uint256);
}

contract StakingMock {
    uint256 private _discountPercent;
    mapping(address => bool) private _hasDiscount;

    function setDiscountPercent(uint256 percent) external {
        _discountPercent = percent;
    }

    function setHasDiscount(address user, bool hasDiscount) external {
        _hasDiscount[user] = hasDiscount;
    }

    function getDiscountPercentage(address user) external view returns (uint256) {
        return _hasDiscount[user] ? _discountPercent : 0;
    }

    function discountPercent() external view returns (uint256) {
        return _discountPercent;
    }
} 