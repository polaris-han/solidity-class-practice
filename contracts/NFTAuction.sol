// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract NFTAuction is Initializable, UUPSUpgradeable {

    struct Auction {
        uint256 id;
        // 售卖者
        address seller;
        // 起始价格
        uint256 startingPrice;
        // 拍卖开始时间
        uint256 startTime;
        // 拍卖持续时间
        uint256 duration;
        // 拍卖是否结束
        bool ended;
        // 最高出价
        uint256 highestBid;
        // 最高出价者
        address highestBidder;
        // nft 合约地址
        address nftContract;
        // nft id
        uint256 tokenId;
    }

    // 状态变量
    mapping (uint256 => Auction) public auctions;
    // 下一个拍卖ID
    uint256 public nextAuctionId;
    // 管理员id
    address public admin;

    function initialize() initializer public {
        admin = msg.sender;
    }


    function createAuction(uint256 _startingPrice, uint256 _duration, address _nftAdress, uint256 _tokenId) external returns (uint256) {
        // only admin can create auctions
        require(msg.sender == admin, "Only admin can create auctions");

        require(_startingPrice > 0, "Starting price must be positive");
        require(_duration > 1000 * 10, "Duration must be at least 10 seconds");

        Auction memory newAuction = Auction({
            id: nextAuctionId,
            seller: msg.sender,
            startingPrice: _startingPrice,
            duration: _duration,
            ended: false,
            highestBid: 0,
            highestBidder: address(0),
            startTime: block.timestamp,
            // nft 合约地址
            nftContract: _nftAdress,
            // nft id
            tokenId: _tokenId
        });

        auctions[nextAuctionId] = newAuction;
        nextAuctionId++;

        return newAuction.id;
    }

    // 买家参与买单
    function placeBid(uint256 _auctionId) external payable {
        Auction storage auction = auctions[_auctionId];

        // 判断当前拍卖是否结束
        require(!auction.ended && block.timestamp < auction.startTime + auction.duration, "Auction has ended");
        require(msg.value > auction.startingPrice, "Bid must be higher than starting price");
        require(msg.value > auction.highestBid, "Bid must be higher than current highest bid");

        // 退还之前的最高出价
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        // 更新最高出价和最高出价者
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;
    }

    // 结束拍卖
    function endAuction(uint256 _auctionId) external {
        Auction storage auction = auctions[_auctionId]; 
        // 判断当前拍卖是否结束
        require(!auction.ended, "Auction already ended");
        require(block.timestamp >= auction.startTime + auction.duration, "Auction is still ongoing");
        // 转移NFT给最高出价者
        IERC721(auction.nftContract).safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);
        // 转移资金给卖家
        payable(address(this)).transfer(address(this).balance);
        // 标记拍卖为结束 
        auction.ended = true;
    }

    function _authorizeUpgrade(address) internal view override {
        // 只有管理员可以升级合约
        require(msg.sender == admin, "Only admin can upgrade");
    }

}