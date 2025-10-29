const {ethers, deployments} = require("hardhat")
const {expect} = require("chai")

describe("TestERC721 with NFTAuction", async function () {
    it("should create auction, place bid and end auction", async function () {
        await main();
    });
});

async function main(params) {
    // 部署合约
    await deployments.fixture(['deployNFTAuction']);
    const nftAuctionProxy = await deployments.get('NFTAuctionProxy');
    console.log("NFTAuction Proxy address:", nftAuctionProxy.address);

    // 部署ERC721合约
    const TestERC721 = await ethers.getContractFactory("TestERC721");
    const testERC721 = await TestERC721.deploy();
    await testERC721.waitForDeployment();
    const testERC721Address = await testERC721.getAddress();

    // 铸造NFT
    const [signer, buyer] = await ethers.getSigners();
    for (let i = 1; i <= 10; i++) {
        await testERC721.mint(signer.address, i);
    }

    const tokenId = 1;

    // 授权NFT拍卖合约
    await testERC721.connect(signer).setApprovalForAll(nftAuctionProxy.address, true);

    // 创建拍卖
    const nftAuction = await ethers.getContractAt("NFTAuction", nftAuctionProxy.address);
    await nftAuction.createAuction(
        ethers.parseEther("0.01"),
        10,
        testERC721Address,
        tokenId
    );

    const auction = await nftAuction.auctions(0);
    console.log("Auction created: ", auction);
    
    // 出价
    await nftAuction.connect(buyer).placeBid(0, {value: ethers.parseEther("0.02")});

    const auctionAfterBid = await nftAuction.auctions(0);
    console.log("Auction after bid: ", auctionAfterBid);

    // 结束拍卖
    await new Promise(resolve => setTimeout(resolve, 11*1000)); // 等待拍卖时间结束
    await nftAuction.connect(signer).endAuction(0);

    const auctionAfterEnd = await nftAuction.auctions(0);
    console.log("Auction after end: ", auctionAfterEnd);

    // 验证NFT归属
    const owner = await testERC721.ownerOf(tokenId);
    console.log("NFT owner after auction: ", owner);
    expect(owner).to.equal(buyer.address);
}