// @ts-ignore
import "./globals.css";

export const metadata = {
  title: "OpenClaw AgentOps | Control Plane",
  description: "Autonomous IDP Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}