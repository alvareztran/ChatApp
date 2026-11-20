import { Outlet } from "react-router-dom";
import { NavigationSidebar } from "../navigation/NavigationSidebar";

export const AppLayout = () => {
  return (
    <div className="app-container">
      <NavigationSidebar />
      <div
        style={{ flex: 1, height: "100%", overflow: "hidden", display: "flex" }}
      >
        <Outlet />
      </div>
    </div>
  );
};
