import { Contract, ethers } from "ethers";
import FactoryMyTokenUpgradeable from "../../contracts/FactoryMyTokenUpgradeable.json";
import { useContext } from "react";
import BlockchainContext from "../../state/BlockchainContext";
import ConnectWallet from "../utils/connect Wallet";

export function useDeployNFTNative() {
  const blockchainContext = useContext(BlockchainContext);
  const { provider } = blockchainContext; // Assuming this is an ethers.js provider

  const deployNFTNative = async () => {
    if (!provider) return;

    const signer = provider.getSigner(); // Get the signer from the provider
    const fnftFactoryMyToken = new Contract(
      process.env.NEXT_PUBLIC_FNFTFACTORY_MYTOKEN_ADDRESS as string,
      FactoryMyTokenUpgradeable.abi,
      signer // Use the signer to interact with the contract
    );

    const nftName = "MyNFT1";
    const nftSymbol = "NFT1";

    // Directly call the deploy function with ethers.js
    try {
      let signer;
      try {
        // Check if the provider has any accounts
        const connectWallet = ConnectWallet();
        signer = await connectWallet;
      } catch (error) {
        console.error("Failed to get signer from provider:", error);
        return;
      }

      if (!signer) return;

      const txResponse = await fnftFactoryMyToken
        .connect(signer)
        .deploy(nftName, nftSymbol);
      await txResponse.wait(); // Wait for the transaction to be mined

      console.log(`Contract deployed! Transaction Hash: ${txResponse.hash}`);
    } catch (error) {
      console.error("Failed to deploy NFT:", error);
    }
  };

  return { deployNFTNative };
}
