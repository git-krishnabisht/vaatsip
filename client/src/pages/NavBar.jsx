import { Box, Button, Spacer, Spinner } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../helpers/useStore";

const BeforeSignInLinks = {
  "About us": "/about",
};

const AfterSignInLinks = {
  Users: "/users",
  "About us": "/about",
};

function NavBar() {
  const { signout } = useStore();
  const isSignedIn = useStore((state) => state.isSignedIn);
  const navigate = useNavigate();

  function handleSignout() {
    signout();
    navigate("/");
  }

  const NavLink = ({ href, children }) => (
    <Box
      as="a"
      href={href}
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
      <Box
        width="100%"
        height="50px"
        display="flex"
        alignItems="center"
        borderBottom="1px solid"
        borderBottomColor="black"
        gap={5}
        px="4px"
      >
        <h2>
          <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
            Home
          </a>
        </h2>

        {!isSignedIn ? 
          Object.entries(BeforeSignInLinks).map(([tag, path]) => (
            <NavLink key={tag} href={path}>
              {tag}
            </NavLink>
          ))
        : Object.entries(AfterSignInLinks).map(([tag, path]) => (
            <NavLink key={tag} href={path}>
              {tag}
            </NavLink>
        ))}

        <Spacer />

        {!isSignedIn ? (
          <Button as={Link} to="/sign-in" size="sm">
            Sign-in
          </Button>
        ) : (
          <Button onClick={handleSignout} size="sm">
            Sign-out
          </Button>
        )}
      </Box>
    </>
  );
}

export default NavBar;
