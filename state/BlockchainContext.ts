import React from 'react';
import {
  JsonRpcProvider,
  JsonRpcSigner,
  Web3Provider,
  Provider,
} from '@ethersproject/providers';
import { BiconomySmartAccountV2 } from '@biconomy/account';
import { ParticleAuthModule } from '@biconomy/particle-auth';

export interface BlockchainContextType {
  provider: JsonRpcProvider | null;

  userInfo: ParticleAuthModule.UserInfo | null;
  setUserInfo: React.Dispatch<
    React.SetStateAction<ParticleAuthModule.UserInfo | null>
  >;

  smartAccount: BiconomySmartAccountV2 | null;
  setSmartAccount: React.Dispatch<
    React.SetStateAction<BiconomySmartAccountV2 | null>
  >;

  smartAccountProvider: Provider | null;
  setSmartAccountProvider: React.Dispatch<
    React.SetStateAction<Provider | null>
  >;
}

const BlockchainContext = React.createContext<BlockchainContextType>({
  provider: null,
  userInfo: null,
  setUserInfo: () => {},
  smartAccount: null,
  setSmartAccount: () => {},
  smartAccountProvider: null,
  setSmartAccountProvider: () => {},
});

export default BlockchainContext;
