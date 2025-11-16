import { SecureChatFixed } from "@/components/patient/secure-chat-fixed";
import { ChatDebug } from "@/components/patient/chat-debug";
import { PatientDashboardNav } from "@/components/patient/patient-nav";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Chat Test | MindGuard",
  description: "Testing secure messaging with your healthcare providers",
};

export default function SecureChatTestPage() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Secure Chat (Test)</h2>
        </div>
        <PatientDashboardNav className="mb-4" />
        <div className="grid gap-4">
          <SecureChatFixed />
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Debug Tools</h3>
            <ChatDebug />
          </div>
        </div>
      </div>
    </div>
  );
} 