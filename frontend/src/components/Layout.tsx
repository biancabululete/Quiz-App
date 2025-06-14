import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import TopbarAdmin from "./TopbarAdmin";
import { useUser } from "./UserContext";

export default function Layout() {
  const { user } = useUser();

  return (
    <div className="bg-white flex flex-col min-h-screen">
      {user?.rol === "ADMIN" ? <TopbarAdmin /> : <Topbar />}
      <main className="pt-24 px-4 flex justify-center">
        <div className="w-full bg-crem rounded-3xl shadow-sm p-8 min-h-[calc(100vh-7rem)] overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
