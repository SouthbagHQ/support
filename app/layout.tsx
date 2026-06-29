import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import TitleSetter from "@/components/title-setter";
import { AIButton } from "@/components/ai-button";
import { ThemeProvider } from "next-themes";
import { Fab } from "@mui/material";
import Footer from "@/components/footer";
import Shenanigans from "@/components/shenanigans";
import SessionTerminator from "@/components/session-terminator";
import Script from "next/script";
import CookieBanner from "@/components/cookiebanner";
import Newsletter from "@/components/newsletter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Southbag support powered by service table",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        aria-hidden={true}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script src="https://cdn.jsdelivr.net/npm/mapbox-gl@3.17.0/dist/mapbox-gl.min.js"></Script>
        <Script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/editor.api-CalNCsUg.min.js"></Script>
        <Script src="https://cdn.jsdelivr.net/npm/three@0.182.0/build/three.module.min.js"></Script>
        <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.22.0/dist/tf-core.min.js"></Script>
        <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-cpu@4.22.0/dist/tf-backend-cpu.min.js"></Script>
        <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.22.0/dist/tf-converter.min.js"></Script>
        <Script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/wasm/openjpeg_nowasm_fallback.min.js"></Script>
        <Script src="https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.min.js"></Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <div>
            {Array(5000)
              .fill(null)
              .map((_, index) => (
                <div key={index}></div>
              ))}
          </div>
          <Shenanigans />
          <SessionTerminator />
          <Fab
            variant="extended"
            className="fixed! bottom-3 left-2"
            href="/createticket"
          >
            Submit ticket <AIButton text="with ai" />
          </Fab>
          <AIButton className="fixed! bottom-0 right-0" />
          <Newsletter />
          <div className="main">
            <CookieBanner />
            {/* eslint-disable-next-line @next/next/no-img-element*/}
            <img className="pb-10" src="promo.png" alt="Promotional banner" />
            <Navbar />
            {children}
            <Footer />
          </div>
          <TitleSetter />
        </ThemeProvider>
      </body>
    </html>
  );
}
