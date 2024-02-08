const web3 = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');

async function findNftHolders(mintAddress) {
    const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'));
    console.log("connection made");

    const mintPublicKey = new web3.PublicKey(mintAddress);
    console.log("mintKey gotten: " + mintPublicKey);

    // Find all token accounts for the given mint address
    const tokenAccounts = await connection.getTokenAccountsByOwner(
        new web3.PublicKey(TOKEN_PROGRAM_ID),
        { mint: mintPublicKey }
    );

    console.log(tokenAccounts);

    const holders = tokenAccounts.value
        .map(({ account }) => {
            // Decode and filter out accounts with a balance of 0
            const data = Buffer.from(account.data);
            const balance = data.readUInt8(64); // Assuming balance is at byte 64, may need adjustment

            if (balance > 0) {
                return account.owner.toBase58();
            }
        })
        .filter(Boolean); // Remove undefined entries

    return holders;
}

// Replace 'YourNFTMintAddressHere' with the actual mint address of the NFT
findNftHolders('2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW')
    .then(holders => console.log('NFT Holders:', holders))
    .catch(err => console.error(err));
