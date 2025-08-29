import { TopNavigation } from "./TopNavigation";
import { ThemeProvider } from "next-themes";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <main className="pt-16 min-h-screen bg-gradient-background relative">
          <div className="container mx-auto px-4 py-6">
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}