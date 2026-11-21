import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { AppRoutes } from "./routes/AppRoutes";

export function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677FF",
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          borderRadius: 8,
          colorBgContainer: "#FFFFFF",
          colorText: "#1F2937",
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
