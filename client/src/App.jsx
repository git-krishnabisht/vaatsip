import { Route, Routes } from "react-router-dom";
import Game from "./pages/TicTacToe";
import HomePage from "./pages/HomePage";
import NavBar from "./pages/NavBar";
import Page1 from "./pages/Page2";
import Page2 from "./pages/Page1";
import SignIn from "./pages/SignIn";
import GetUsers from "./pages/GetUsers";
import { Box, useColorModeValue } from "@chakra-ui/react";
import CreateAccount from "./pages/CreateAccount";

function App() {
  return (
    <>
      <Box minH={"100vh"} bg={useColorModeValue('blackAlpha.100', 'blackAlpha.900')}>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tic-tac-toe" element={<Game />} />
          <Route path="/docs" element={<Page1 />} />
          <Route path="/about-us" element={<Page2 />} />
          <Route path="/get-users" element={<GetUsers />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/sign-in" element={<SignIn />} />
        </Routes>
      </Box >
    </>
  );
}

export default App;
