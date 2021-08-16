pragma solidity >=0.6.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "prb-math/contracts/PRBMathSD59x18.sol";
import "hardhat/console.sol";
//import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
//import "@openzeppelin/contracts/utils/math/SafeMath.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract YourContract {
  
  using PRBMathSD59x18 for int256;
  
  struct Ballot {
    uint256 castAt;
    address[] candidates;
    int256[] votes; 
  }

  struct Election {
    string note; 
    uint256 createdAt; 
    int256[] ballotIds;
    mapping(int256 => Ballot) idToBallot;
  }

  Election[] internal elections;
  Ballot[] internal ballots; 

  int256 id;

  address owner;
  
  mapping(address => int256[]) internal addressToBallotIds;
  mapping(address => int256) internal addressToScore;
  mapping(int256 => Ballot) internal idToBallot;

  function createElection(string memory _note, address[] memory _adrs) public {
    
    //require(msg.sender == owner, "Not Owner!");
    uint n = _adrs.length; 

    Election storage election = Election({
      note: "", 
      createdAt: block.timestamp, 
      ballotIds: new int256[](n)
    });
    
    
    for (uint i = 0; i < _adrs.length; i++) {
        
      idToBallot[id] = Ballot({
        castAt: 0, 
        candidates: new address[](n - 1), 
        votes: new int256[](n - 1)
      });

      idToBallot[id].candidates = _adrs;

      addressToBallotIds[_adrs[i]] = id;  
      election.ballotIds[i] = id;

      election.note = _note;
      id++; // Increment ID on creation
    } 
    
    elections.push(election);

  }

  function getScore(address _adr) public view returns (int256) {
    return addressToScore[_adr];
  }

  function getBallotIds(address _adr) public view returns (int256[] memory) {
    return addressToBallotIds[_adr];
  }

  function getBallot(int256 _id) public view returns (Ballot memory) {
    return idToBallot[_id];
  }

  function _checkBallot(Ballot memory _ballot) internal view returns (bool) {
    
    if (_ballot.candidates.length != _ballot.votes.length) {
      return false;
    }
    
    for (uint i = 0; i < _ballot.candidates.length; i++) {
      
      if (_ballot.candidates[i] == msg.sender && _ballot.votes[i] > 0) {
        return false;
      } 
      
    }

    return true;
  }

  function vote(address[] memory _adrs, int256[] memory _votes) public {
    
    


    //Ballot memory ballot = Ballot(block.timestamp, _adrs, _votes);
    //Ballot memory ballot = addressToBallotIds[msg.sender]


    //require(_checkBallot(ballot), "Invalid Ballot!");

    //addressToBallotIds[msg.sender].push(id);
    //ballots.push(ballot);
    //idToBallot[id] = ballots[ballots.length - 1];
    
    for (uint i = 0; i < _adrs.length; i++) {
      addressToScore[_adrs[i]] += PRBMathSD59x18.sqrt(_votes[i]);
    }
    
    //id++;

  }

  constructor() {
    // what should we do on deploy?
    id = 0; 
    owner = msg.sender; 
  }

}
