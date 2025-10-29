const {deployments, upgrades, ethers} = require('hardhat');
const fs = require('fs');
const path = require('path');

// deploy/00_deploy_my_contract.js
module.exports = async ({getNamedAccounts, deployments}) => {
  const {save} = deployments;
  const {deployer} = await getNamedAccounts();
  
  console.log("Deploying NFTAuction with account:", deployer);

  const NFTAuction = await ethers.getContractFactory("NFTAuction");
  
  const nftAuctionProxy = await upgrades.deployProxy(NFTAuction, [], {initializer: 'initialize'});

  await nftAuctionProxy.waitForDeployment();
  
  const proxyAddress = await nftAuctionProxy.getAddress();
  console.log("NFTAuction Proxy deployed to:", proxyAddress);

  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("NFTAuction Implementation deployed to:", implAddress);

  const storePath = path.resolve(__dirname, './.cache/proxyNFTAuction.json');
  fs.writeFileSync(
        storePath,
        JSON.stringify({
            proxyAddress,
            implAddress,
            abi: NFTAuction.interface.format("json"),
        })
    );

  await save('NFTAuctionProxy', {
    address: proxyAddress,
    abi: NFTAuction.interface.format("json")
  });
};
module.exports.tags = ['deployNFTAuction'];