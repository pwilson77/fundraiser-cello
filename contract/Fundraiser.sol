// SPDX-License-Identifier: MIT  

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Fundraiser {

    struct FundraiserDetails {
        string fundRaiserName;
        string prizeName;
        string prizeImage;
        address payable organizer;
        bool status;
        uint amountToBeRaised;
        uint numberOfContributions;
        uint256 amountRaised;
        address contractAddress;
        address winnerAddress;
    }

    FundraiserDetails internal fundraiserDetails;
    address[] userAddresses;
    address internal winnerAddress;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    
    constructor(
        address payable _organizer, 
        uint _amountToBeRaised,
        string memory _fundraiserName,
        string memory _prizeName,
        string memory _prizeImage
    ) {
        fundraiserDetails = FundraiserDetails(
            _fundraiserName, _prizeName, _prizeImage, _organizer, true,
            _amountToBeRaised, 0, 0, address(this), address(0) 
        );
    }

    function contribute (uint256 _amount) public payable {
        require(fundraiserDetails.status, "Fundraiser has ended");
        IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        fundraiserDetails.numberOfContributions++;
        fundraiserDetails.amountRaised = fundraiserDetails.amountRaised + _amount;
        userAddresses.push(msg.sender);

        if(fundraiserDetails.amountRaised >= fundraiserDetails.amountToBeRaised) {
            randomlySelectWinner();
            fundraiserDetails.status = false;
            fundraiserDetails.winnerAddress = winnerAddress;
        }
    }

    function withdraw () public payable {
        require(msg.sender == fundraiserDetails.organizer, 
            "You don't have permission to use this function");
        fundraiserDetails.status = false;
        IERC20Token(cUsdTokenAddress).transfer(
            msg.sender,
            fundraiserDetails.amountRaised
        );    
    }

    function getFundraiserDetails () public view returns (
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
        return (
            fundraiserDetails.fundRaiserName,
            fundraiserDetails.prizeName,
            fundraiserDetails.prizeImage,
            fundraiserDetails.organizer,
            fundraiserDetails.status,
            fundraiserDetails.amountToBeRaised,
            fundraiserDetails.numberOfContributions,
            fundraiserDetails.amountRaised, 
            fundraiserDetails.contractAddress
        );
    }

    function randomlySelectWinner () internal {
        uint256 randomNumber = uint256(blockhash(block.number - 1));
        uint256 winnerIndex = randomNumber % userAddresses.length;
        winnerAddress = userAddresses[winnerIndex]; 
    }

}
