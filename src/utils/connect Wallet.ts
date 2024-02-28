import { ethers } from "ethers";

export default async function ConnectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      // Request account access
      await window.ethereum.enable();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      return signer;
    } catch (error) {
      console.error("User denied account access");
    }
  } else {
    console.error(
      "Non-Ethereum browser detected. You should consider trying MetaMask!"
    );
  }
}
