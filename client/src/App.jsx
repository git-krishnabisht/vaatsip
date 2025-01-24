import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NavBar from "./pages/NavBar";
import SignIn from "./pages/SignIn";
import GetUsers from "./pages/GetUsers";
import { Box, useColorModeValue } from "@chakra-ui/react";
import SignUp from "./pages/SignUp";
import ChatContainer from "./pages/ChatContainer";
import { Toaster } from "react-hot-toast";
import UsersProfile from "./pages/UsersProfile";

function App() {
  return (
    <>
      <Box
        minH={"100vh"}
        bg={useColorModeValue("blackAlpha.100", "blackAlpha.900")}
      >
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat/:receiver" element={<ChatContainer />} />
          <Route path="/get-users" element={<GetUsers />} />
          <Route path="/create-account" element={<SignUp />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/user/:user" element={<UsersProfile />} />
        </Routes>
        <Toaster position="bottom-center" reverseOrder={false} />
      </Box>
    </>
  );
}

export default App;
