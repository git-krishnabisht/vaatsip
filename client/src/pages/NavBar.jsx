import { Box, Button, Container, Spacer, Spinner } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useEffect } from "react";
import { socketService } from "../services/socketService";

const BeforeSignInLinks = {
  "About us": "/about",
};

const AfterSignInLinks = {
  "Users" : "/users",
  "About us": "/about",
};

function NavBar() {
  const { signout } = authService();
  const isSignedIn = authService((state) => state.isSignedIn);
  const navigate = useNavigate();
  const { connectSocket } = authService();

  useEffect(() => {
    if(isSignedIn) {
      connectSocket();
    }
  },[isSignedIn]);


  const handleSignout = (e) => {
    e.preventDefault();
    signout();
    navigate("/");
  }

  const NavLink = ({ href, children }) => (
    <Box
      as={Link}
      to={href}
      position="relative"
      style={{ textDecoration: "none", color: "inherit" }}
      _after={{
        content: '""',
        position: "absolute",
        width: "0%",
        height: "2px",
        bottom: "-4px",
        left: "50%",
        backgroundColor: "green.500",
        transition: "all 0.3s ease",
        transform: "translateX(-50%)",
      }}
      _hover={{
        _after: {
          width: "100%",
        },
      }}
    >
      {children}
    </Box>
  );

  return (
    <>
      <Container>
        <Box
          width="100%"
          height="50px"
          display="flex"
          alignItems="center"
          borderBottom="1px solid"
          borderBottomColor="black"
          maxHeight={"20%"}
          gap={5}
          px="2%"
          position="fixed"
          top={0}
          left={0}
          right={0}
          zIndex={10}
          bg="white"
        >
          <h2>
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              Home
            </Link>
          </h2>

          {!isSignedIn
            ? Object.entries(BeforeSignInLinks).map(([tag, path]) => (
                <NavLink key={tag} href={path} preventDefault>
                  {tag}
                </NavLink>
              ))
            : Object.entries(AfterSignInLinks).map(([tag, path]) => (
                <NavLink key={tag} href={path} preventDefault>
                  {tag}
                </NavLink>
              ))}

          <Spacer />

          {!isSignedIn ? (
            <Button as={Link} to="/sign-in" size="md">
              Sign-in
            </Button>
          ) : (
            <Button onClick={handleSignout} size="md">
              Sign-out
            </Button>
          )}
        </Box>
      </Container>
    </>
  );
}

export default NavBar;
