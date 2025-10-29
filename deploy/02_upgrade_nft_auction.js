const {ethers, upgrades} = require("hardhat");
const fs = require('fs');
const path = require('path');

module.exports = async ({getNamedAccounts, deployments}) => {
    const {save} = deployments;
    const {deployer} = await getNamedAccounts();

    console.log("Upgrading NFTAuction with account:", deployer);

    // 读取.cache/proxyNFTAuction.json 文件，获取 proxy 地址
    const storePath = path.resolve(__dirname, './.cache/proxyNFTAuction.json');
    const storeData = fs.readFileSync(storePath, "utf-8");
    const {proxyAddress, implAddress, abi} = JSON.parse(storeData);

    // 升级合约
    const NFTAuction = await ethers.getContractFactory("NFTAuction");

    // 升级代理合约
    const nftAuctionProxy = await upgrades.upgradeProxy(proxyAddress, NFTAuction);
    await nftAuctionProxy.waitForDeployment();
    const proxyAddress2 = await nftAuctionProxy.getAddress();
    console.log("NFTAuction Proxy upgraded to:", proxyAddress2);

    // 保存代理合约地址
    // fs.writeFileSync(storePath, JSON.stringify({
    //     proxyAdress,
    //     implAddress
    //     })
    // );
    
    await save('NFTAuctionProxy', {
        address: proxyAddress2,
        abi
    });
}

module.exports.tags = ['upgradeNFTAuction'];