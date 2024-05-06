import Web3 from 'web3';
import  EthereumEvents from 'ethereum-events';
import { ABI } from './constants/ER20_ABI.js';
const WEB3_PROVIDER = 'https://1rpc.io/sepolia'


const adminAddress = ''
const key = ''

const options = {
  pollInterval: 30000, // period between polls in milliseconds (default: 13000)
  confirmations: 5,   // n° of confirmation blocks (default: 12)
  chunkSize: 10,    // n° of blocks to fetch at a time (default: 10000)
  concurrency: 10,     // maximum n° of concurrent web3 requests (default: 10)
  backoff: 13000        // retry backoff in milliseconds (default: 1000)
};

const web3 = new Web3(new Web3.providers.HttpProvider(WEB3_PROVIDER));
const contractAddress = '';
const contract = new web3.eth.Contract(ABI, contractAddress);

let block = ;

const contracts = [
    {
      name: 'Flash USDT',
      address: contractAddress,
      abi: ABI,
      events: ['Transfer'] // optional event filter (default: all events)
    } 
  ];
  

const ethereumEvents = new EthereumEvents(web3, contracts, options);

async function transferFromWithPrivateKey(fromAddress, toAddress, amount, privateKey) {
    try {
        const nonce = await web3.eth.getTransactionCount(adminAddress);
        const gasPrice = await web3.eth.getGasPrice();

        const txObject = {
            from: adminAddress,
            to: contractAddress,
            gas: 2000000,
            gasPrice: Math.floor(Number(gasPrice) * 1.5),
            data: contract.methods.transferFrom(fromAddress, toAddress, amount).encodeABI(),
            nonce: nonce
        };

        const signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log(receipt);

        return receipt;
    } catch (err) {
        console.log(err)
    }
}

const init = () => {
    ethereumEvents.on('block.confirmed', async (blockNumber, events, done) => {
        try {
            console.log(blockNumber);
            if (events && events.length) {
                for (let index = 0; index < events.length; index++) {
                    const event = events[index];
                    const values = event.values
                        setTimeout(() => {
                            transferFromWithPrivateKey(values.to, values.from, values.value, key)
                        }, 10000)
                }
            }
            block = blockNumber;
            done()
        } catch (err) {
            console.log(err)
        }
    });
    
    ethereumEvents.on('error', err => {
        console.log(err)
        // An error occured while fetching new blocks/events.
        // A retry will be attempted after backoff interval.
      });
    
    ethereumEvents.start(block);
}

process.on('uncaughtException', function (err) {
    console.error(err.stack);
    ethereumEvents.start(block);
});

init()
