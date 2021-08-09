# quadratic-diplomacy

Use this general purpose dApp skeleton to square that diplomacy! 

## Getting Started

Clone this repo and install dependencies. 

```sh
git clone https://github.com/lazl0x/quadratic-diplomacy.git
cd quadratic-diplomacy
npm install
```

Once Hardhat is installed, navigate to the React App directory and install the dependencies. 

```sh
cd app
npm install
```

### Hardhat Quickstart

> Hardhat is a development environment to compile, deploy, test, and debug your Ethereum software. 

See the Hardhat [website](https://hardhat.org/) and [boiler-plate repo](https://github.com/nomiclabs/hardhat-hackathon-boilerplate) for more information.


#### Creating Local Testnet

To spin up a local Ethereum Hardhat Network run the `npx hardhat node` task. 

#### Testing Contracts

To test the contracts with `scripts/...` run the `npx hardhat test` task.

#### Compiling Contracts

To compile the `contracts/` run the `npx hardhat compile` task. 

##### Deploying Contracts

To deploy `contracts/` to local, testnet, or mainnet, run `npx hardhat run scripts/<DEPLOYMENT_SCRIPT>.js`. 

## Directory Structure 

```
quadratic-diplomacy
├── app                   // React Application 
├── contracts             // Contracts
├── hardhat.config.js     // Hardhat Configuration
├── package.json          // Package dependencies/config
├── package-lock.json     
├── README.md              
├── res                   // Project Resources
├── scripts               // Deployment & etc. Scripts
├── test                  // Contract Test Scripts
└── tokenlog.json         // Tokenlog(?)
```
