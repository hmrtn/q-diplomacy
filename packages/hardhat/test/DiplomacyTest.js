const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Quadratic Diplomacy", function () {
  let myContract;

  describe("Diplomacy", function () {
    it("Should deploy Diplomacy", async function () {
      const Diplomacy = await ethers.getContractFactory("Diplomacy");

      diplomacy = await Diplomacy.deploy();
    });

    describe("newElection()", function () {
      it("Should be able to create new election", async function () {
        await diplomacy.newElection("Test Election", [
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        ]);
      });
    });
  });
});
