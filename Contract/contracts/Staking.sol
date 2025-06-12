// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable {
    IERC20 public coreToken;
    uint256 public minimumStake = 100 * 10**18; // Assuming 18 decimals
    uint256 public discountPercent = 20;

    mapping(address => uint256) public stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    constructor(address coreTokenAddress, address initialOwner) Ownable(initialOwner) {
        coreToken = IERC20(coreTokenAddress);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(coreToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        stakes[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        stakes[msg.sender] -= amount;
        require(coreToken.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }

    function hasDiscount(address user) external view returns (bool) {
        return stakes[user] >= minimumStake;
    }

    function setMinimumStake(uint256 newMinimum) external onlyOwner {
        minimumStake = newMinimum;
    }

    function setDiscountPercent(uint256 newPercent) external onlyOwner {
        require(newPercent <= 100, "Invalid discount percent");
        discountPercent = newPercent;
    }
}
