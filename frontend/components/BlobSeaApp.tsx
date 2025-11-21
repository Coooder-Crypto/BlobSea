'use client';

import Link from "next/link";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";

const heroHighlights = [
  { label: "步骤 01", detail: "加密文件上传到 Walrus" },
  { label: "步骤 02", detail: "Manifest 写入链上 Listing" },
  { label: "步骤 03", detail: "买家获取 License 解密下载" },
];

const featureCards = [
  {
    title: "模块化上手",
    body: "落地页、发送页与购买页各司其职，帮助团队分角色协作。",
  },
  {
    title: "Walrus 原生",
    body: "围绕 Walrus commit + Sui Listing 的核心路径设计交互。",
  },
  {
    title: "轻量体验",
    body: "没有多余表单或弹窗，聚焦必填信息与状态提示。",
  },
];

const workflowCards = [
  {
    badge: "发送数据",
    title: "上传＋上架",
    description: "一站式完成加密上传 Walrus 以及链上 Listing 的创建。",
    cta: "前往发送",
    href: "/sell",
  },
  {
    badge: "购买数据",
    title: "浏览＋解密",
    description: "查找 Listing、完成支付并在 License 里即时解密下载。",
    cta: "前往购买",
    href: "/buy",
  },
];

export default function BlobSeaApp() {
  return (
    <Container size="4" mt="6" px="4" pb="8">
      <Flex direction="column" gap="5">
        <section className="hero-panel">
          <Flex direction="column" gap="4">
            <Badge color="green" variant="soft" size="2" style={{ width: "fit-content" }}>
              Walrus + Sui
            </Badge>
            <Heading size="8" style={{ lineHeight: 1.1 }}>
              让加密数据的上链与交易分区更清晰
            </Heading>
            <Text size="4" color="gray">
              BlobSea 将落地页、发送页面与购买页面拆分，保持每一步骤专注，
              同时用一套视觉语言承载 Walrus 与 Sui 的完整流程。
            </Text>
            <div className="hero-actions">
              <Button size="3" asChild>
                <Link href="/sell">立即发送</Link>
              </Button>
              <Button size="3" variant="surface" asChild>
                <Link href="/buy">前往购买</Link>
              </Button>
            </div>
            <Flex wrap="wrap" gap="3" mt="3">
              {heroHighlights.map((item) => (
                <Box key={item.label} className="flow-pill">
                  <Text weight="bold">{item.label}</Text>{" "}
                  <Text color="gray">{item.detail}</Text>
                </Box>
              ))}
            </Flex>
          </Flex>
        </section>

        <div className="features-grid">
          {featureCards.map((feature) => (
            <Card key={feature.title} className="feature-card">
              <Flex direction="column" gap="2">
                <Heading size="4">{feature.title}</Heading>
                <Text color="gray">{feature.body}</Text>
              </Flex>
            </Card>
          ))}
        </div>

        <div className="workflow-grid">
          {workflowCards.map((workflow) => (
            <Card key={workflow.title} className="workflow-card">
              <Flex direction="column" gap="3">
                <Badge variant="soft" color="blue" style={{ width: "fit-content" }}>
                  {workflow.badge}
                </Badge>
                <Heading size="5">{workflow.title}</Heading>
                <Text color="gray">{workflow.description}</Text>
                <Button size="2" variant="surface" asChild>
                  <Link href={workflow.href}>{workflow.cta}</Link>
                </Button>
              </Flex>
            </Card>
          ))}
        </div>
      </Flex>
    </Container>
  );
}
