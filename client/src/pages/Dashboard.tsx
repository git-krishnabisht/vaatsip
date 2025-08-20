/*
  * bashbord like whatsapp where it has main three parts 
  *  -> side option bar: which contains all the options to show on the big side bar (like: message, status, settings, profile, etc.)
  *  -> chat list bar: where the stuff like users chat options , status options, etc comes
  *  -> content window: where all the main stuff like chats, status goes
  *  -> navbar in the conent window
  */
import Content from "../components/Content";
import OptionBar from "../components/OptionBar";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Dashboard() {
  return (
    <div className="flex flex-row h-screen">

      <div className="basis-10 md:basis-14 lg:basis-16 border-r-1 border-black shrink-0">
        <OptionBar />
      </div>

      <div className="hidden sm:block sm:basis-60 md:basis-80 lg:basis-100 border-r-1 border-black shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b-1 border-black mt-10">
          <Navbar />
        </div>

        <div className="flex-1 overflow-auto">
          <Content />
        </div>
      </div>

    </div>
  );
}

export default Dashboard;

