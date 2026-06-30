import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "@/lib/providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CYC-INTEL // Satellite Cyclone Intelligence & Temporal Interpolation",
  description: "Deep learning temporal interpolation platform for cyclone satellite imagery. Developed for the ISRO Hackathon (PS-12).",
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
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-space-navy-950 text-slate-100 font-sans">
        <Providers>
          <div className="flex flex-col min-h-screen relative overflow-x-hidden selection:bg-cyan-accent/30 selection:text-white">
            {/* Ambient background glow dots */}
            <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-electric-blue/5 blur-[120px] pointer-events-none -z-10"></div>
            <div className="absolute bottom-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-cyan-accent/3 blur-[140px] pointer-events-none -z-10"></div>
            
            <Navbar />
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
