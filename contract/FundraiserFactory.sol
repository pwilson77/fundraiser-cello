// SPDX-License-Identifier: MIT  

pragma solidity >=0.7.0 <0.9.0;

import {Fundraiser} from "./Fundraiser.sol";

contract FundraiserFactory {
    address[] public fundraisers;

    /**
        * @dev allow users to create a fundraiser
        * @notice input data to create a fundraiser needs to contain only valid values
    */
    function createFundRaiser (
        uint _amountToBeRaised,
        string calldata _fundraiserName,
        string calldata _prizeName,
        string calldata _prizeImage
    ) public returns (address) {
        require(bytes(_fundraiserName).length > 0,"Empty name for fundraiser");
        require(bytes(_prizeName).length > 0,"Empty prize name");
        require(bytes(_prizeImage).length > 0,"Empty image of prize");
        address fundraiser = address(new Fundraiser(payable(msg.sender), _amountToBeRaised, _fundraiserName, _prizeName, _prizeImage ));
        fundraisers.push(fundraiser);
        return fundraiser;
    }

    /**
        * @return details of a fundraiser
     */
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
        require(index < getNumberOfFundraisers(), "Query of a nonexistent fundraiser");
        Fundraiser fundr = Fundraiser(fundraisers[index]);
        return fundr.getFundraiserDetails();
    }

    function getNumberOfFundraisers() public view returns (uint) {
        return fundraisers.length;
    }
}