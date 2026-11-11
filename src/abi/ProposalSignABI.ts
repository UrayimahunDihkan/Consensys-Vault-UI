export const ProposalSignABI = [
  {
    "type": "function",
    "name": "addMember",
    "inputs": [
      {
        "name": "_addr",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "allMembers",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allProposals",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct ProposalSign.SignatureInfo[]",
        "components": [
          {
            "name": "applicant",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "signatures",
            "type": "address[]",
            "internalType": "address[]"
          },
          {
            "name": "proposal",
            "type": "uint8",
            "internalType": "enum ProposalSign.Proposal"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "indexOfUnsignedProposals",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "propose",
    "inputs": [
      {
        "name": "_proposal",
        "type": "uint8",
        "internalType": "enum ProposalSign.Proposal"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "removeMember",
    "inputs": [
      {
        "name": "_addr",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "signatureMap",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "applicant",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "proposal",
        "type": "uint8",
        "internalType": "enum ProposalSign.Proposal"
      }
    ],
    "stateMutability": "view"
  }
] as const;
