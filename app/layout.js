import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata = {
  title: "Pritesh's DropNotify",
  description:
    "Track product prices across e-commerce sites and get alerts on price drops",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}

        <Toaster richColors />
      </body>
    </html>
  );
}
