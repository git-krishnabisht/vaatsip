import { useState } from "react";
import Content from "../components/Content";
import OptionBar from "../components/OptionBar";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import type { User } from "../utils/get-users.util";

function Dashboard() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div className="flex flex-row h-screen">
      <div className="basis-10 md:basis-14 lg:basis-16 border-r-1 border-black shrink-0">
        <OptionBar />
      </div>

      <div className="hidden sm:block sm:basis-60 md:basis-80 lg:basis-100 border-r-1 border-black shrink-0">
        <Sidebar onUserClick={setSelectedUser} />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b-1 border-black mt-10">
          <Navbar />
        </div>

        <div className="flex-1 overflow-auto">
          <Content selectedUser={selectedUser} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

