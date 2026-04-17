import { useState } from "react";
import AppShell from "@/components/AppShell";
import Dashboard from "@/components/Dashboard";
import RoutePlanner from "@/components/RoutePlanner";
import GoalsRewards from "@/components/GoalsRewards";
import Competition from "@/components/Competition";
import RouteConditions from "@/components/RouteConditions";
import AddTrip from "@/pages/AddTrip";
import MyTrips from "@/pages/MyTrips";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "add-trip":
        return <AddTrip />;
      case "my-trips":
        return <MyTrips />;
      case "routes":
        return <RoutePlanner />;
      case "conditions":
        return <RouteConditions />;
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
