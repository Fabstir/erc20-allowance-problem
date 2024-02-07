import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { JsonRpcProvider, Provider } from "@ethersproject/providers";

import config from "../../config.json";

import {
  IHybridPaymaster,
  PaymasterMode,
  SponsorUserOperationDto,
} from "@biconomy/paymaster";
import { BiconomySmartAccountV2 } from "@biconomy/account";

/**
 * Function to handle Biconomy payment for a given user operation with sponsorship.
 * It checks if the smart account is defined and throws an error if it is not.
 * It then gets the Biconomy paymaster and paymaster service data for the given user operation.
 * It then gets the paymaster and data response for the user operation.
 * Finally, it sends the user operation and returns the user operation response.
 *
 * @function
 * @param {any} userOp - The user operation to handle Biconomy payment for.
 * @returns {Promise<any>} - The user operation response.
 */
export default function useBiconomyPayment(
  provider: JsonRpcProvider | undefined,
  smartAccountProvider: Provider | undefined,
  smartAccount: BiconomySmartAccountV2 | undefined
) {
  const blockchainContext = console.log(
    "useMintNestableNFT: provider = ",
    provider
  );
  console.log(
    "useMintNestableNFT: smartAccountProvider = ",
    smartAccountProvider
  );

  /**
   * Function to handle Biconomy payment for a given user operation.
   * It checks if the smart account is defined and throws an error if it is not.
   * It then gets the Biconomy paymaster and fee quotes for the given user operation.
   * If the fee quotes are not defined, it throws an error.
   * It then calculates the gas fee for the user operation and builds the final user operation.
   * Finally, it sends the user operation and returns the user operation response.
   *
   * @function
   * @param {any} partialUserOp - The partial user operation to handle Biconomy payment for.
   * @returns {Promise<any>} - The user operation response.
   */
  const handleBiconomyPayment = async (partialUserOp: any) => {
    if (!smartAccount)
      throw new Error(
        `useMintNestableNFT: handleBiconomyPayment: smartAccount is undefined`
      );

    const biconomyPaymaster =
      smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;

    const feeQuotesResponse =
      await biconomyPaymaster.getPaymasterFeeQuotesOrData(partialUserOp, {
        mode: PaymasterMode.ERC20,
        tokenList: [],
        preferredToken: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS,
      });

    const feeQuotes = feeQuotesResponse.feeQuotes;
    if (!feeQuotes)
      throw new Error(
        `useMintNestableNFT: handleBiconomyPayment: feeQuotes is undefined`
      );

    const spender = feeQuotesResponse.tokenPaymasterAddress || "";

    const selectedFeeQuote = feeQuotes[0];

    const { symbol, tokenAddress, decimal, maxGasFee } = selectedFeeQuote;

    if (!provider)
      throw new Error(
        `useMintNestableNFT: handleBiconomyPayment: provider is undefined`
      );

    const gasPrice = await provider.getGasPrice();

    const maxGasFeeRounded = parseFloat(maxGasFee.toString()).toFixed(decimal);
    const parseMaxGasFee = parseUnits(maxGasFeeRounded, decimal);

    const feeAmount = gasPrice
      .mul(parseMaxGasFee)
      .div(BigNumber.from(10).pow(selectedFeeQuote.decimal));

    const finalUserOp = await smartAccount.buildTokenPaymasterUserOp(
      partialUserOp,
      {
        feeQuote: selectedFeeQuote,
        spender: spender,
        maxApproval: false,
      }
    );

    let paymasterServiceData = {
      mode: PaymasterMode.ERC20,
      feeTokenAddress: selectedFeeQuote.tokenAddress,
      calculateGasLimits: true,
    };

    const paymasterAndDataWithLimits =
      await biconomyPaymaster.getPaymasterAndData(
        finalUserOp,
        paymasterServiceData
      );

    finalUserOp.paymasterAndData = paymasterAndDataWithLimits.paymasterAndData;

    if (
      paymasterAndDataWithLimits.callGasLimit &&
      paymasterAndDataWithLimits.verificationGasLimit &&
      paymasterAndDataWithLimits.preVerificationGas
    ) {
      finalUserOp.callGasLimit = paymasterAndDataWithLimits.callGasLimit;
      finalUserOp.verificationGasLimit =
        paymasterAndDataWithLimits.verificationGasLimit;
      finalUserOp.preVerificationGas =
        paymasterAndDataWithLimits.preVerificationGas;
    }

    const userOpResponse = await smartAccount.sendUserOp(finalUserOp);

    return userOpResponse;
  };

  /**
   * Function to handle Biconomy payment for a given user operation with sponsorship.
   *
   * @function
   * @param {any} userOp - The user operation to handle Biconomy payment for.
   * @returns {Promise<any>} - The user operation response.
   */
  const handleBiconomyPaymentSponsor = async (userOp: any) => {
    if (!smartAccount)
      throw new Error(
        `useMintNestableNFT: handleBiconomyPayment: smartAccount is undefined`
      );

    const userOpResponse = await smartAccount.sendUserOp(userOp);
    return userOpResponse;
  };

  function createTransaction() {
    return {
      to: (address: string) => {
        return {
          data: (data: any) => {
            return {
              to: address,
              data: data,
            };
          },
        };
      },
    };
  }

  return {
    handleBiconomyPayment,
    handleBiconomyPaymentSponsor,
    createTransaction,
  };
}
