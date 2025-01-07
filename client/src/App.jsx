import { Route, Routes } from "react-router-dom";
import Game from "./pages/TicTacToe";
import HomePage from "./pages/HomePage";
import NavBar from "./pages/NavBar";
import SignIn from "./pages/SignIn";
import GetUsers from "./pages/GetUsers";
import { Box, useColorModeValue } from "@chakra-ui/react";
import SignUp from "./pages/SignUp";
import ChatContainer from "./pages/ChatContainer";

function App() {
  return (
    <>
      <Box minH={"100vh"} bg={useColorModeValue('blackAlpha.100', 'blackAlpha.900')}>
        <NavBar/>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat/:receiver" element={<ChatContainer />} />
          <Route path="/tic-tac-toe" element={<Game />} />
          <Route path="/get-users" element={<GetUsers />} />
          <Route path="/create-account" element={<SignUp />} />
          <Route path="/sign-in" element={<SignIn />} />
        </Routes>
      </Box >
    </>
  );
}

export default App;
