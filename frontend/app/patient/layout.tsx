import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { SideNav } from "@/components/patient/side-nav";
import { TopNav } from "@/components/patient/top-nav";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <div className="flex flex-1">
          {/* Desktop SideNav - hidden on mobile */}
          <div className="hidden md:block">
            <SideNav isOpen={true} />
          </div>
          <main className="flex-1 p-6 md:p-8 bg-gray-100 dark:bg-gray-900">{children}</main>
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}