import { SecureChat } from "@/components/patient/secure-chat";
import { PatientDashboardNav } from "@/components/patient/patient-nav";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Chat | MindGuard",
  description: "Securely message your healthcare providers",
};

export default function SecureChatPage() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Secure Chat</h2>
        </div>
        <PatientDashboardNav className="mb-4" />
        <div className="grid gap-4">
          <SecureChat />
        </div>
      </div>
    </div>
  );
} 