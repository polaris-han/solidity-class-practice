const {ethers, deployments} = require("hardhat")
const {expect} = require("chai")

describe("starting", async function () {
    it("should work", async function () {
        // 部署合约
        await deployments.fixture(['deployNFTAuction']);
        const nftAuctionProxy = await deployments.get('NFTAuctionProxy');
        // 调用 方法创建拍卖
        const nftAuction = await ethers.getContractAt("NFTAuction", nftAuctionProxy.address);
        await nftAuction.createAuction(
            ethers.parseEther("0.01"),
            100*1000,
            ethers.ZeroAddress,
            1 
        )

        const auction = await nftAuction.auctions(0);
        console.log("Auction created: ", auction);

        // 升级合约
        await deployments.fixture(['upgradeNFTAuction']);

        // 再次读取拍卖信息
        const auction2 = await nftAuction.auctions(0);
        console.log("Auction created 2: ", auction2);

        expect(auction2.startPrice).to.equal(auction.startPrice);
    });
})