// SPDX-License-Identifier: MIT  

pragma solidity >=0.7.0 <0.9.0;

import {Fundraiser} from "./Fundraiser.sol";

contract FundraiserFactory {
    address[] public fundraisers;
    address public owner;

    function createFundRaiser (
        uint _amountToBeRaised,
        string memory _fundraiserName,
        string memory _prizeName,
        string memory _prizeImage
    ) public returns (address) {
        address fundraiser = address(new Fundraiser(payable(msg.sender), _amountToBeRaised, _fundraiserName, _prizeName, _prizeImage ));
        fundraisers.push(fundraiser);
        return fundraiser;
    }

    function getFundraiserDetails(uint index) public view returns (
        string memory,
        string memory,
        string memory,
        address payable,
        bool,
        uint,
        uint,
        uint256,
        address
    ) {
        Fundraiser fundr = Fundraiser(fundraisers[index]);
        return fundr.getFundraiserDetails();
    }

    function getNumberOfFundraisers() public view returns (uint) {
        return fundraisers.length;
    }
}