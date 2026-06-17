import "./globals.css";

export const metadata = {
  title: "Aegis Mesh | Control Plane",
  description: "Autonomous SRE Fleet Orchestration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Mellow Theme Foundation:
        We use a softer text-slate-200 and a baseline background of slate-900
        to prevent eye strain during long monitoring sessions.
      */}
      <body className="antialiased bg-slate-900 text-slate-200 min-h-screen selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}