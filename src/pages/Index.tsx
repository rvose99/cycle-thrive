import { useState } from "react";
import AppShell from "@/components/AppShell";
import Dashboard from "@/components/Dashboard";
import RoutePlanner from "@/components/RoutePlanner";
import GoalsRewards from "@/components/GoalsRewards";
import Competition from "@/components/Competition";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "routes":
        return <RoutePlanner />;
      case "goals":
        return <GoalsRewards />;
      case "competition":
        return <Competition />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AppShell>
  );
};

export default Index;
