import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NavBar from "./pages/NavBar";
import AboutUsPage from "./pages/AboutUsPage";
import { Container } from "@chakra-ui/react";
import SignInPage from "./pages/SignInPage";
import UsersPage from "./pages/UsersPage";
import { Toaster } from "react-hot-toast";
import ChatPage from "./pages/ChatPage";
import ProfileDetailsPage from "./pages/ProfileDetailsPage";

function App() {
  return (
    <>
      <Container fluid>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile/:username" element={<ProfileDetailsPage />} />
        </Routes>
        <Toaster position="bottom-center" reverseOrder={false} />
      </Container>
    </>
  );
}

export default App;
