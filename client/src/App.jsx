import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NavBar from "./pages/NavBar";
import AboutUsPage from "./pages/AboutUsPage";
import { Container } from "@chakra-ui/react";
import SignInPage from "./pages/SignInPage";
import OnlineUsersPage from "./pages/OnlineUsersPage";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
    <Container>
      <NavBar />
      <Container fluid>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/online-users" element={<OnlineUsersPage />} />
        </Routes>
        <Toaster position="bottom-center" reverseOrder={false} />
      </Container>
    </Container>
    </>
  );
}

export default App;
