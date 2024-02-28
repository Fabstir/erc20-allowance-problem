import { Inter } from "next/font/google";
import { useContext, useEffect, useState } from "react";
import BlockchainContext from "@/state/BlockchainContext";
import useParticleAuth from "@/src/blockchain/useParticleAuth";
import { useDeployNFT } from "@/src/blockchain/useDeployNFT";
import { useDeployNFTNative } from "@/src/blockchain/useDeployNFTNative";
import { PaymasterMode } from "@biconomy/paymaster";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const blockchainContext = useContext(BlockchainContext);
  const {
    provider,
    smartAccountProvider,
    setSmartAccountProvider,
    smartAccount,
    setSmartAccount,
  } = blockchainContext;

  const [smartAccountAddress, setSmartAccountAddress] = useState<string>("");

  const { socialLogin, logout } = useParticleAuth();
  const [userInfo, setUserInfo] = useState<any>(undefined);

  const { deployNFT } = useDeployNFT();
  const { deployNFTNative } = useDeployNFTNative();

  const connect = async () => {
    try {
      const { biconomySmartAccount, web3Provider, userInfo } =
        await socialLogin();

      if (!(biconomySmartAccount && web3Provider && userInfo))
        throw new Error("index: connect: login failed");

      const acc = await biconomySmartAccount.getAccountAddress();
      console.log("index: connect: acc = ", acc);
      setSmartAccountAddress(await biconomySmartAccount.getAccountAddress());
      setSmartAccount(biconomySmartAccount);
      setSmartAccountProvider(web3Provider);

      setUserInfo(userInfo);
    } catch (e) {
      if (e instanceof Error) {
        const errorMessage = "index: connect: error received";
        console.error(`${errorMessage} ${e.message}`);
        throw new Error(errorMessage);
      } else {
        // handle non-Error objects if possible, or rethrow
        throw e;
      }
    }
  };

  useEffect(() => {
    // Update the context value
    const setSmartAccountAddressFn = async () => {
      if (smartAccount)
        setSmartAccountAddress(await smartAccount.getAccountAddress());
    };
    setSmartAccountAddressFn();
  }, [smartAccount]);

  async function handleClick(mode: PaymasterMode) {
    await deployNFT(mode);
  }

  async function handleClickNative() {
    await deployNFTNative();
  }

  async function handleLogout() {
    await logout();
    setSmartAccount(null);
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="uppercase text-2xl font-bold mb-6">
        Test Biconomy ERC20 Allowance Problem
      </h1>

      <br />
      {!smartAccount && (
        <button
          onClick={connect}
          color="white"
          className="mt-4 text-xl font-semibold dark:bg-gray-200 bg-gray-200"
        >
          Log in
        </button>
      )}
      <br />

      {smartAccount && (
        <h2 className="">Smart Account: {smartAccountAddress}</h2>
      )}
      {smartAccount && (
        <button
          onClick={handleLogout}
          color="white"
          className="mt-2 mb-6 dark:bg-gray-200 bg-gray-200"
        >
          Log out
        </button>
      )}
      <br />
      <br />

      <button onClick={() => handleClick(PaymasterMode.ERC20)}>
        Deploy NFT with AA ERC20
      </button>
      <br />
      <button onClick={() => handleClick(PaymasterMode.SPONSORED)}>
        Deploy NFT with AA Sponsored
      </button>
      <br />
      <button onClick={handleClickNative}>Deploy NFT</button>
    </div>
  );
}
