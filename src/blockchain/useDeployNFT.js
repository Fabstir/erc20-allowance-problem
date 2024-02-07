import { Contract, ethers } from "ethers";
import FNFTFactoryMyToken from "../../contracts/FNFTFactoryMyToken.json";
import useBiconomyPayment from "./useBiconomyPayment";
import { useContext } from "react";
import BlockchainContext from "../../state/BlockchainContext";

export function useDeployNFT() {
  const blockchainContext = useContext(BlockchainContext);
  const { provider, smartAccountProvider, smartAccount } = blockchainContext;

  const {
    createTransaction,
    handleBiconomyPayment,
    handleBiconomyPaymentSponsor,
  } = useBiconomyPayment(provider, smartAccountProvider, smartAccount);

  const deployNFT = async () => {
    const fnftFactoryTipNFT = new Contract(
      process.env.NEXT_PUBLIC_FNFTFACTORY_MYTOKEN_ADDRESS,
      FNFTFactoryMyToken.abi,
      smartAccountProvider
    );

    const nftName = "MyNFT1";
    const nftSymbol = "NFT1";

    const txFactoryMyTokenContract =
      await fnftFactoryTipNFT.populateTransaction.deploy(nftName, nftSymbol);

    const transactionFactoryMyTokenContract = createTransaction()
      .to(fnftFactoryTipNFT.address)
      .data(txFactoryMyTokenContract.data);

    let partialUserOp = await smartAccount.buildUserOp(
      [transactionFactoryMyTokenContract],
      {
        skipBundlerGasEstimation: false, // Estimates userop using bundler
      }
    );

    const userOpResponse = await handleBiconomyPaymentSponsor(partialUserOp);

    console.log(`useMintNFT: userOps Hash: ${userOpResponse.userOpHash}`);
    const transactionUserOpDetails = await userOpResponse.wait();

    console.log(
      `useDeployNFT: transactionUserOpDetails: ${JSON.stringify(
        transactionUserOpDetails,
        null,
        "\t"
      )}`
    );
  };

  return { deployNFT };
}
