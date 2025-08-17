import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ThemeProvider } from "@/components/theme-provider"
// import { AuthProvider } from "@/hooks/useAuth"
import Providers from "@/components/providers/web3-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Supply Chain Dashboard",
  description: "Blockchain-powered supply chain management",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  console.log("🟦 LAYOUT RUNNING FROM /src/app/ FOLDER (REORGANIZED)")
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <div style={{position: 'fixed', top: 0, right: 0, background: 'blue', color: 'white', padding: '5px', zIndex: 9999}}>
          🟦 /src/app/ LAYOUT
        </div>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
