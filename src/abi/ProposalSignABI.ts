export const ProposalSignABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_initialSigners",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "stateMutability": "nonpayable"
  },
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
          },
          {
            "name": "infos",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "transferTo",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "transferCurrency",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "transferAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "execFlow",
            "type": "uint8",
            "internalType": "enum ProposalSign.ExecFlow"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSignatureInfo",
    "inputs": [
      {
        "name": "hash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct ProposalSign.SignatureInfo",
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
          },
          {
            "name": "infos",
            "type": "string[]",
            "internalType": "string[]"
          },
          {
            "name": "transferTo",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "transferCurrency",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "transferAmount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "execFlow",
            "type": "uint8",
            "internalType": "enum ProposalSign.ExecFlow"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hashOfUnexecutedProposals",
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
    "name": "markAfterExecuted",
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
    "name": "proposeOrgNameChange",
    "inputs": [
      {
        "name": "_newOrgName",
        "type": "string",
        "internalType": "string"
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
    "name": "proposeTransfer",
    "inputs": [
      {
        "name": "_to",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_currency",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_amount",
        "type": "uint256",
        "internalType": "uint256"
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
    "name": "signProposal",
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
      },
      {
        "name": "transferTo",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "transferCurrency",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "transferAmount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "execFlow",
        "type": "uint8",
        "internalType": "enum ProposalSign.ExecFlow"
      }
    ],
    "stateMutability": "view"
  }
] as const;