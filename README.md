![CARBO](carbo.svg "Carbo Token")

# CARBO smart contracts

* _Standart_        : [BEP20](https://github.com/binance-chain/BEPs/blob/master/BEP20.md)
* _[Name](https://github.com/binance-chain/BEPs/blob/master/BEP20.md#5111-name)_            : CARBO
* _[Ticker](https://github.com/binance-chain/BEPs/blob/master/BEP20.md#5112-symbol)_          : CARBO
* _[Decimals](https://github.com/binance-chain/BEPs/blob/master/BEP20.md#5113-decimals)_        : 18
* _Emission_        : One-time, 500 000 000 tokens
* _Fiat dependency_ : No
* _Token locks_     : Yes

## Smart contracts description

CARBO smart-contract

### Contracts
1. _CARBOToken_- Token contract
2. _CrowdSale_ - Sale contract
3. _VestingWallet_ - Wallet contract

### How to work with this project
#### To start working with the contracts, please, follow theese steps for each contract:
1. Compile the contract using Remix with `enable optimization` flag and `compiler version` set to `0.8.0`.
2. Copy `.env.example` to `.env` and fill in the parameters.
2. Deploy the contract using deployment script:  
   ```truffle exec scripts/1_deploy_configurator.js --network NetworkName```  
   for example:  
   ```truffle exec scripts/1_deploy_configurator.js --network ropsten```
3. After deployment, run the following command with one or more contracts that you wish to verify:  
    ```truffle run verify SomeContractName@SomeContractAddress AnotherContractName@AnotherContractAddress --network NetworkName [--debug]```  
    for example:  
    ```truffle run verify  CARBO@0xd4eE90e82FE10d37d028084f262fbC092E2aEF81 --network ropsten```  
    You can find all information about deployed smart contracts in the file `report.NetworkName.log`.
#### How to get constructor arguements generated during deployment
1. Browse to your contract on Etherscan and click on the hash of the transaction with which it was created.
2. On the top right, where it reads "Tools & utilities", click on the arrow to see more options and select "Parity Trace".
3. For the action pertaining the contract creation, click on "Click to see more" below to see the input/output.
4. Copy the content of the "Init" field and paste somewhere in text file.
5. Copy "bytecode" string from ContractName.json generated by truffle and place it near the string from the previous step.
6. The difference between theese two strings is your encoded constructor arguements.
7. Pass them to `truffle-verify-plugin` as paramter: `--forceConstructorArgs string:ABIEncodedArguments`

### Wallets with BEP20 support
1. [MyEtherWallet](https://www.myetherwallet.com)
2. Parity
3. Mist/Ethereum wallet

EXODUS does not support BEP20, but provides the ability to export the private key to MyEtherWallet - http://support.exodus.io/article/128-how-do-i-receive-unsupported-erc20-tokens

## Main network configuration

### Contracts
* [CARBOToken](https://bscscan.com/token/)
* [CrowdSale](https://bscscan.com/address/)
* [VestingWallet](https://bscscan.com/address/)

## Test network configuration (BSC Testnet)
You can find test log [here](docs/bsctestnet.log.md)

## User's guide
You can find the user guide for end-users [here](docs/user.md)

## Manager's guide
Our manager's guide can be found [here](docs/manager.md)  
Additional info about smart contract's capabilities (in Russian) [here](docs/additional.md)