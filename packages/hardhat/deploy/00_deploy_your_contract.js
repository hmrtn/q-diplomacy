// deploy/00_deploy_your_contract.js

//const { utils } = require("ethers");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("Diplomacy", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    // args: [ "Hello", utils.parseEther("1.5") ],
    log: true,
  });

  /*
    // Getting a previously deployed contract
    const YourContract = await ethers.getContract("YourContract", deployer);
    await YourContract.setPurpose("Hello");

    //const yourContract = await ethers.getContractAt('YourContract', "0xaAC799eC2d00C013f1F11c37E654e59B0429DF6A") //<-- if you want to instantiate a version of a contract at a specific address!
  */

  const Diplomacy = await ethers.getContract("Diplomacy", deployer);
  await Diplomacy.transferOwnership(
    "0x76c48E1F02774C40372a3497620D946136136172"
  );

  // await Diplomacy._deposit({
  //   value: ethers.utils.parseEther("1"),
  // });

  await Diplomacy.newElection("Build #1", 1, 10, [
    "0x76c48E1F02774C40372a3497620D946136136172",
    "0x01684C57AE8a4226271068210Ce1cCED865a5AfC",
    "0xf5De4337Ac5332aF11BffbeC45D950bDDBc1493F",
    "0x4E53E14de4e264AC2C3fF501ed3Bd6c4Ad63B9A1",
  ]);

  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */

  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */

  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */
};
module.exports.tags = ["Diplomacy"];
