import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";

export default function Layout() {
  return (
    <div className="bg-crem min-h-screen overflow-hidden">
      <Topbar />

      <main className="pt-24 px-4 shadow-lg flex justify-center">
        <div className="w-full bg-white rounded-3xl shadow-sm p-8 min-h-[calc(100vh-7rem)] overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}