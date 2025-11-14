import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const MARKETPLACE_PACKAGE_ID =
  process.env.NEXT_PUBLIC_MARKETPLACE_PACKAGE_ID ?? "";
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID ?? "";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        marketplacePackageId: MARKETPLACE_PACKAGE_ID,
        marketplaceId: MARKETPLACE_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
