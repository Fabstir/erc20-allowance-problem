import { Contract, ethers } from "ethers";
import FactoryMyTokenUpgradeable from "../../contracts/FactoryMyTokenUpgradeable.json";
import useBiconomyPayment from "./useBiconomyPayment";
import { useContext } from "react";
import BlockchainContext from "../../state/BlockchainContext";
import { PaymasterMode } from "@biconomy/paymaster";

export function useDeployNFT() {
  const blockchainContext = useContext(BlockchainContext);
  const { provider, smartAccountProvider, smartAccount } = blockchainContext;

  if (!provider || !smartAccountProvider || !smartAccount) {
    return {
      deployNFT: () => {
        throw new Error("Blockchain context is not ready");
      },
    };
  }
  const {
    createTransaction,
    handleBiconomyPayment,
    handleBiconomyPaymentSponsor,
  } = useBiconomyPayment(provider, smartAccountProvider, smartAccount);

  const deployNFT = async (mode) => {
    const fnftFactoryTipNFT = new Contract(
      process.env.NEXT_PUBLIC_FNFTFACTORY_MYTOKEN_ADDRESS,
      FactoryMyTokenUpgradeable.abi,
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

    console.log(`useMintNFT: partialUserOp: cgl ${partialUserOp.callGasLimit}`);

    let userOpResponse;

    if (mode === PaymasterMode.ERC20)
      userOpResponse = await handleBiconomyPayment(partialUserOp);
    else userOpResponse = await handleBiconomyPaymentSponsor(partialUserOp);

    if (!userOpResponse) throw new Error("useMintNFT: userOpResponse is null");

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
