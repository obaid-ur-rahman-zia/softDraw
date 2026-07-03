import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP } from "@/lib/constants";
import { AuthSessionProvider } from "@/providers/session-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import { ModalProvider } from "@/providers/modal-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP.APP_NAME} - ${APP.APP_TITLE_DESCRIPTION}`,
  description:
    "SoftDraw provides modern software tools and creative digital solutions.",
  keywords: [
    `${APP.APP_NAME}`,
    "software",
    "digital solutions",
    "web tools",
    "drawing tools",
    "plivix projects",
    "web solutions",
    "draw.io",
    "excalidraw",
    "whiteboard",
    "Excali Draw",
    "Whiteboards",
    "Canva",
    "Figma",
    "drawing tool",
    "collaboration",
    "tools",
  ],
  authors: [{ name: `${APP.APP_NAME} Team`, url: `${APP.APP_DOMAIN}` }],
  metadataBase: new URL(`${APP.APP_DOMAIN}`),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: APP.APP_NAME,
    description: APP.APP_DESCRIPTION,
    url: `${APP.APP_DOMAIN}`,
    siteName: APP.APP_NAME,
    images: [
      {
        url: "/logo-rounded.png", // resolved via metadataBase
        width: 1200,
        height: 630,
        alt: "SoftDraw Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP.APP_NAME,
    description: APP.APP_DESCRIPTION,
    images: ["/logo-rounded.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
        <AuthSessionProvider>
          <Toaster />
          <ModalProvider />
          {children}
          <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: APP.APP_NAME,
              url: APP.APP_DOMAIN,
              logo: `${APP.APP_DOMAIN}/logo-rounded.png`
            }),
          }}
        />
        </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
