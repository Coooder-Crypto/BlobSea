'use client';

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Flex,
  Heading,
  Text,
  Button,
} from "@radix-ui/themes";
import { useSuiClient } from "@mysten/dapp-kit";

import { useNetworkVariable } from "@/lib/networkConfig";

type Props = {
  currentAddress?: string;
};

export default function LicenseInventory({ currentAddress }: Props) {
  const marketplacePackageId = useNetworkVariable("marketplacePackageId");
  const suiClient = useSuiClient();

  const {
    data: licenses,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["blobsea-licenses", currentAddress, marketplacePackageId],
    enabled: Boolean(currentAddress && marketplacePackageId),
    queryFn: async () => {
      if (!currentAddress || !marketplacePackageId) return [];
      const structType = `${marketplacePackageId}::marketplace::License`;
      const response = await suiClient.getOwnedObjects({
        owner: currentAddress,
        filter: { StructType: structType },
        options: {
          showContent: true,
        },
      });
      return response.data.map((item) => {
        const fields = (item.data?.content as any)?.fields ?? {};
        return {
          objectId: item.data?.objectId ?? "",
          listingId: fields.listing_id ?? "",
          encryptedKey: fields.encrypted_key ?? "",
          grantedAt: Number(fields.granted_at ?? 0),
        };
      });
    },
    refetchInterval: 30_000,
  });

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between">
          <Heading size="4">我的 License</Heading>
          <Button variant="soft" size="2" onClick={() => refetch()}>
            刷新
          </Button>
        </Flex>

        {!currentAddress && (
          <Text color="gray">连接钱包后可查看已购买的 License。</Text>
        )}
        {currentAddress && !marketplacePackageId && (
          <Text color="gray">请配置 Marketplace 包信息。</Text>
        )}

        {isLoading && currentAddress && <Text>加载中...</Text>}
        {error && (
          <Text color="red">
            获取 License 失败：
            {error instanceof Error ? error.message : String(error)}
          </Text>
        )}
        {licenses && licenses.length === 0 && (
          <Text color="gray">暂无 License，先购买一份 Listing。</Text>
        )}

        {licenses && licenses.length > 0 && (
          <Flex direction="column" gap="2">
            {licenses.map((license) => (
              <Card key={license.objectId}>
                <Text>License 对象：{license.objectId}</Text>
                <Text color="gray">Listing：{license.listingId}</Text>
                <Text color="gray">
                  加密密钥（预览）：{license.encryptedKey?.slice(0, 20)}...
                </Text>
              </Card>
            ))}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
