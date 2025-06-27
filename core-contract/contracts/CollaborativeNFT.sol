// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract CollaborativeNFT is ERC721, Ownable, ERC2981 {
    uint256 private _tokenIds;
    
    struct Collaboration {
        address[] collaborators;
        uint256[] shares; // Percentage shares (basis points, e.g., 5000 = 50%)
        bool isActive;
        string metadata;
        uint96 royaltyFee; // in basis points (e.g., 500 = 5%)
    }
    
    mapping(uint256 => Collaboration) public collaborations;
    mapping(address => uint256[]) public userCollaborations;
    mapping(uint256 => address) public paymentSplitters;
    
    event CollaborationCreated(
        uint256 indexed tokenId,
        address[] collaborators,
        uint256[] shares,
        string metadata,
        uint96 royaltyFee,
        address paymentSplitter
    );
    
    event CollaborationUpdated(
        uint256 indexed tokenId,
        address[] collaborators,
        uint256[] shares
    );
    
    event CollaborationDissolved(uint256 indexed tokenId);
    
    constructor() ERC721("Collaborative Thesis NFT", "CTHESIS") {}
    
    function createCollaboration(
        address[] memory _collaborators,
        uint256[] memory _shares,
        string memory _metadata,
        uint96 _royaltyFee // in basis points
    ) public returns (uint256) {
        require(_collaborators.length > 1, "At least 2 collaborators required");
        require(_collaborators.length == _shares.length, "Arrays length mismatch");
        require(_collaborators.length <= 10, "Max 10 collaborators allowed");
        require(_royaltyFee <= 1000, "Royalty fee too high (max 10%)");
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < _shares.length; i++) {
            require(_collaborators[i] != address(0), "Invalid collaborator address");
            require(_shares[i] > 0, "Share must be greater than 0");
            totalShares += _shares[i];
        }
        require(totalShares == 10000, "Total shares must equal 100% (10000 basis points)");
        
        _tokenIds += 1;
        uint256 newTokenId = _tokenIds;
        
        collaborations[newTokenId] = Collaboration({
            collaborators: _collaborators,
            shares: _shares,
            isActive: true,
            metadata: _metadata,
            royaltyFee: _royaltyFee
        });
        
        // Add token to each collaborator's list
        for (uint256 i = 0; i < _collaborators.length; i++) {
            userCollaborations[_collaborators[i]].push(newTokenId);
        }
        
        // Deploy PaymentSplitter for this collaboration
        address splitter = address(new PaymentSplitter(_collaborators, _shares));
        paymentSplitters[newTokenId] = splitter;
        
        // Set ERC-2981 royalty info for this token
        _setTokenRoyalty(newTokenId, splitter, _royaltyFee);
        
        _mint(msg.sender, newTokenId);
        
        emit CollaborationCreated(newTokenId, _collaborators, _shares, _metadata, _royaltyFee, splitter);
        
        return newTokenId;
    }
    
    function getCollaboration(uint256 _tokenId) public view returns (
        address[] memory collaborators,
        uint256[] memory shares,
        bool isActive,
        string memory metadata,
        uint96 royaltyFee,
        address paymentSplitter
    ) {
        Collaboration memory collab = collaborations[_tokenId];
        return (collab.collaborators, collab.shares, collab.isActive, collab.metadata, collab.royaltyFee, paymentSplitters[_tokenId]);
    }
    
    function getUserCollaborations(address _user) public view returns (uint256[] memory) {
        return userCollaborations[_user];
    }
    
    function updateCollaboration(
        uint256 _tokenId,
        address[] memory _newCollaborators,
        uint256[] memory _newShares
    ) public {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Only token owner can update collaboration");
        
        Collaboration storage collab = collaborations[_tokenId];
        require(collab.isActive, "Collaboration is not active");
        
        require(_newCollaborators.length > 1, "At least 2 collaborators required");
        require(_newCollaborators.length == _newShares.length, "Arrays length mismatch");
        require(_newCollaborators.length <= 10, "Max 10 collaborators allowed");
        
        uint256 totalShares = 0;
        for (uint256 i = 0; i < _newShares.length; i++) {
            require(_newCollaborators[i] != address(0), "Invalid collaborator address");
            require(_newShares[i] > 0, "Share must be greater than 0");
            totalShares += _newShares[i];
        }
        require(totalShares == 10000, "Total shares must equal 100% (10000 basis points)");
        
        // Remove old collaboration from user lists
        for (uint256 i = 0; i < collab.collaborators.length; i++) {
            removeCollaborationFromUser(collab.collaborators[i], _tokenId);
        }
        
        // Update collaboration
        collab.collaborators = _newCollaborators;
        collab.shares = _newShares;
        // Optionally: redeploy PaymentSplitter if collaborators/shares change
        // For simplicity, not redeploying here
        
        // Add new collaboration to user lists
        for (uint256 i = 0; i < _newCollaborators.length; i++) {
            userCollaborations[_newCollaborators[i]].push(_tokenId);
        }
        
        emit CollaborationUpdated(_tokenId, _newCollaborators, _newShares);
    }
    
    function dissolveCollaboration(uint256 _tokenId) public {
        require(_exists(_tokenId), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Only token owner can dissolve collaboration");
        
        Collaboration storage collab = collaborations[_tokenId];
        require(collab.isActive, "Collaboration is not active");
        
        collab.isActive = false;
        
        // Remove collaboration from all user lists
        for (uint256 i = 0; i < collab.collaborators.length; i++) {
            removeCollaborationFromUser(collab.collaborators[i], _tokenId);
        }
        
        emit CollaborationDissolved(_tokenId);
    }
    
    function removeCollaborationFromUser(address _user, uint256 _tokenId) internal {
        uint256[] storage userCollabs = userCollaborations[_user];
        for (uint256 i = 0; i < userCollabs.length; i++) {
            if (userCollabs[i] == _tokenId) {
                userCollabs[i] = userCollabs[userCollabs.length - 1];
                userCollabs.pop();
                break;
            }
        }
    }
    
    function isCollaborator(uint256 _tokenId, address _user) public view returns (bool) {
        Collaboration memory collab = collaborations[_tokenId];
        for (uint256 i = 0; i < collab.collaborators.length; i++) {
            if (collab.collaborators[i] == _user) {
                return true;
            }
        }
        return false;
    }
    
    function getCollaboratorShare(uint256 _tokenId, address _user) public view returns (uint256) {
        Collaboration memory collab = collaborations[_tokenId];
        for (uint256 i = 0; i < collab.collaborators.length; i++) {
            if (collab.collaborators[i] == _user) {
                return collab.shares[i];
            }
        }
        return 0;
    }

    // --- ERC-2981 Royalty Standard ---
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 