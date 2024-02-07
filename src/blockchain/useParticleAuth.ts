import { Web3Provider } from "@ethersproject/providers";

import { ParticleAuthModule, ParticleProvider } from "@biconomy/particle-auth";
import { IBundler, Bundler } from "@biconomy/bundler";
import {
  BiconomySmartAccountV2,
  BiconomySmartAccountV2Config,
  DEFAULT_ENTRYPOINT_ADDRESS,
} from "@biconomy/account";
import { IPaymaster, BiconomyPaymaster } from "@biconomy/paymaster";
import { ChainId } from "@biconomy/core-types";
import {
  ECDSAOwnershipValidationModule,
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
} from "@biconomy/modules";

import { createTransak, getTransak, initTransak } from "../hooks/useTransakSDK";

/**
 * Function to fund a Biconomy Smart Account using Transak.
 * It takes the user info and Biconomy Smart Account as arguments and returns a promise that resolves to a Transak object.
 *
 * @async
 * @function
 * @param {ParticleAuthModule.UserInfo} userInfo - The user info object.
 * @param {BiconomySmartAccountV2} smartAccount - The Biconomy Smart Account object.
 * @returns {Promise<any>} A promise that resolves to a Transak object.
 */
export default function useParticleAuth() {
  const particle = new ParticleAuthModule.ParticleNetwork({
    projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID as string,
    clientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY as string,
    appId: process.env.NEXT_PUBLIC_PARTICLE_APP_ID as string,
    wallet: {
      displayWalletEntry: true,
      defaultWalletEntryPosition: ParticleAuthModule.WalletEntryPosition.BR,
      uiMode: "light",
    },
  });

  function getChainId(envVar: string | undefined): ChainId {
    const chainIdNumber = Number(envVar);
    if (Object.values(ChainId).includes(chainIdNumber)) {
      return chainIdNumber as ChainId;
    } else {
      throw new Error(
        "Invalid or missing NEXT_PUBLIC_CHAIN_ID environment variable"
      );
    }
  }

  const chainId = getChainId(process.env.NEXT_PUBLIC_CHAIN_ID);

  const bundler: IBundler = new Bundler({
    bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL as string,
    chainId,
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
  });

  const paymaster: IPaymaster = new BiconomyPaymaster({
    paymasterUrl: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_URL as string,
  });

  const login = async (
    isFresh: boolean = false
  ): Promise<ParticleAuthModule.UserInfo | null> => {
    let userInfo: ParticleAuthModule.UserInfo | null;
    const isLoggedIn = particle.auth.isLogin();

    if (!isLoggedIn && !isFresh) {
      userInfo = await particle.auth.login();
    } else if (isLoggedIn) userInfo = particle.auth.getUserInfo();
    else return null;

    return userInfo;
  };

  const logout = async () => {
    particle.auth.logout().then(() => {
      console.log("logout");
    });
  };

  /**
   * Function to log in a user using Particle Auth and return a Biconomy Smart Account, Web3Provider, and user info.
   * It returns a promise that resolves to an object with the Biconomy Smart Account, Web3Provider, and user info.
   *
   * @async
   * @function
   * @returns {Promise<{
   *   biconomySmartAccount: BiconomySmartAccountV2;
   *   web3Provider: Web3Provider;
   *   userInfo: ParticleAuthModule.UserInfo;
   * }>} A promise that resolves to an object with the Biconomy Smart Account, Web3Provider, and user info.
   */
  const socialLogin = async (
    isFresh: boolean = false
  ): Promise<{
    biconomySmartAccount: BiconomySmartAccountV2 | null;
    web3Provider: Web3Provider | null;
    userInfo: ParticleAuthModule.UserInfo | null;
  }> => {
    const userInfo = await login(isFresh);
    if (!userInfo)
      return {
        biconomySmartAccount: null,
        web3Provider: null,
        userInfo: null,
      };

    console.log("Logged in user:", userInfo);

    //support languages: en, zh-CN, zh-TW, zh-HK, ja, ko
    particle.setLanguage("en");

    // support fiat coin values: 'USD' | 'CNY' | 'JPY' | 'HKD' | 'INR' | 'KRW'
    particle.setFiatCoin("USD");

    // enable ERC-4337, openWallet will open Account Abstraction Wallet
    particle.setERC4337({
      name: "BICONOMY",
      version: "2.0.0",
    });

    particle.setAuthTheme({
      uiMode: "light",
      displayCloseButton: true,
      displayWallet: true, // display wallet entrance when send transaction.
      modalBorderRadius: 10, // auth & wallet modal border radius. default 10.
    });

    const particleProvider = new ParticleProvider(particle.auth);
    console.log({ particleProvider });
    const web3Provider = new Web3Provider(particleProvider, "any");

    const signer = web3Provider.getSigner();

    const module = await ECDSAOwnershipValidationModule.create({
      signer: signer, // you will need to supply a signer from an EOA in this step
      moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
    });

    const biconomySmartAccountConfig: BiconomySmartAccountV2Config = {
      chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) as ChainId,
      bundler: bundler,
      paymaster: paymaster,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      defaultValidationModule: module,
    };

    let biconomySmartAccount = await BiconomySmartAccountV2.create(
      biconomySmartAccountConfig
    );

    const smartContractAddress = await biconomySmartAccount.getAccountAddress();
    console.log("address: ", smartContractAddress);

    const result = {
      biconomySmartAccount,
      web3Provider,
      userInfo,
    };

    return result;
  };

  // /**
  //  * Function to fund a Biconomy Smart Account using Transak.
  //  * It takes the user info and Biconomy Smart Account as arguments and returns a promise that resolves to a Transak object.
  //  *
  //  * @async
  //  * @function
  //  * @param {ParticleAuthModule.UserInfo} userInfo - The user info object.
  //  * @param {BiconomySmartAccountV2} smartAccount - The Biconomy Smart Account object.
  //  * @returns {Promise<any>} A promise that resolves to a Transak object.
  //  */
  // const fundYourSmartAccount = async (
  //   userInfo: ParticleAuthModule.UserInfo,
  //   smartAccount: BiconomySmartAccountV2,
  // ): Promise<any> => {
  //   try {
  //     const biconomySmartAccount = smartAccount;
  //     if (!biconomySmartAccount)
  //       throw new Error('biconomySmartAccount is undefined');

  //     const smartAccountAddress =
  //       await biconomySmartAccount.getAccountAddress();

  //     const transakData = {
  //       walletAddress: smartAccountAddress,
  //       firstName: userInfo?.name || '',
  //       email: userInfo?.email || '',
  //     };

  //     const transakObject = createTransak('STAGING', transakData);

  //     initTransak(transakObject);

  //     const transak = getTransak(transakObject);
  //     return transak;
  //   } catch (error) {
  //     throw new Error(
  //       'useMintNFT: handleFundYourSmartAccount: error received ',
  //       error,
  //     );
  //   }
  // };

  return {
    socialLogin,
    //   fundYourSmartAccount,
    login,
    logout,
  };
}
