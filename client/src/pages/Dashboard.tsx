import Content from "../components/Content";
import OptionBar from "../components/OptionBar";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useUserDetails } from "../contexts/UserDetailsProvider";

function Dashboard() {
  const { userDetails, setUserDetails } = useUserDetails();

  return (<>
    <div className="flex flex-row h-screen">
      <div className="basis-10 md:basis-14 lg:basis-16 border-r border-black shrink-0 bg-gray-100">
        <OptionBar />
      </div>

      <div className="hidden sm:block sm:basis-60 md:basis-80 lg:basis-100 border-r border-black shrink-0">
        <Sidebar onUserClick={setUserDetails} />
      </div>

      {userDetails ? (
        <div className="flex-1 flex flex-col">
          <div className="border-b border-black bg-gray-100">
            <Navbar selectedUser={userDetails} />
          </div>

          <div className="flex-1 overflow-auto">
            <Content selectedUser={userDetails} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No Content
        </div>
      )}
    </div>
  </>);
}

export default Dashboard;

