import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "THESIS-NFT - Support Innovation. Mint the Future.",
  description:
    "Invest in groundbreaking student research by minting thesis projects as NFTs. Fund the next generation of innovators on the blockchain.",
  keywords: ["NFT", "Web3", "Education", "Thesis", "Investment", "Blockchain", "Ethereum"],
  authors: [{ name: "THESIS-NFT Team" }],
  creator: "THESIS-NFT",
  publisher: "THESIS-NFT",
  applicationName: "THESIS-NFT",
  generator: "THESIS-NFT Platform",
  referrer: "origin-when-cross-origin",
  colorScheme: "dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1b4b" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thesis-nft.com",
    title: "THESIS-NFT - Support Innovation. Mint the Future.",
    description: "Invest in groundbreaking student research by minting thesis projects as NFTs.",
    siteName: "THESIS-NFT",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "THESIS-NFT - Support Innovation. Mint the Future.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THESIS-NFT - Support Innovation. Mint the Future.",
    description: "Invest in groundbreaking student research by minting thesis projects as NFTs.",
    creator: "@thesisnft",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "web3-app-name": "THESIS-NFT",
    "dapp-name": "THESIS-NFT",
    "ethereum-app-name": "THESIS-NFT",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#1e1b4b" />
        <meta name="application-name" content="THESIS-NFT" />
        <meta name="apple-mobile-web-app-title" content="THESIS-NFT" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1e1b4b" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Web3/DApp specific meta tags */}
        <meta name="dapp:name" content="THESIS-NFT" />
        <meta name="dapp:description" content="Support Innovation. Mint the Future." />
        <meta name="dapp:image" content="/icon-512.png" />
        <meta name="ethereum:application-name" content="THESIS-NFT" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
