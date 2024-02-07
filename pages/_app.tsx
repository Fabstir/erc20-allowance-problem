import React, { useState } from "react";
import BlockchainContext from "../state/BlockchainContext";
import { AppProps } from "next/app";
import { ParticleAuthModule } from "@biconomy/particle-auth";
import { JsonRpcProvider, Provider } from "@ethersproject/providers";
import { BiconomySmartAccountV2 } from "@biconomy/account";

export default function App({ Component, pageProps }: AppProps) {
  const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_PROVIDER);

  const [userInfo, setUserInfo] = useState<ParticleAuthModule.UserInfo | null>(
    null
  );
  const [smartAccount, setSmartAccount] =
    useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountProvider, setSmartAccountProvider] =
    useState<Provider | null>(null);

  return (
    <BlockchainContext.Provider
      value={{
        provider,
        userInfo,
        setUserInfo,
        smartAccount,
        setSmartAccount,
        smartAccountProvider,
        setSmartAccountProvider,
      }}
    >
      <Component {...pageProps} />
    </BlockchainContext.Provider>
  );
}
