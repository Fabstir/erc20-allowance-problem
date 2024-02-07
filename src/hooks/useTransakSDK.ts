/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import transakSDK from '@transak/transak-sdk';
import { ITransakDto, environments } from '../utils/interface';

interface TransakObject {
  apiKey: string;
  transak: any;
}

function createTransak(
  environment: environments,
  transakData: ITransakDto = {},
): TransakObject {
  let apiKey: string;
  if (environment === 'PRODUCTION') {
    throw new Error('Transak production is not supported yet');
  } else {
    apiKey = process.env.NEXT_PUBLIC_TRANSAK_STAGING_API_KEY as string;
  }

  const transak = new transakSDK({
    apiKey,
    widgetHeight: '625px',
    widgetWidth: '500px',
    environment,
    ...transakData,
  });

  return { apiKey, transak };
}

function initTransak(transakObject: TransakObject) {
  try {
    transakObject.transak.init();
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (err: any) {
    console.error(err);
    throw new Error('Error while init transakSDK');
  }
}

function getTransak(transakObject: TransakObject) {
  return transakObject.transak;
}

export { createTransak, initTransak, getTransak };
