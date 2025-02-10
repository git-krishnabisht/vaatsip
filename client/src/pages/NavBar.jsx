import { Box, Button, Spacer } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useStore } from "../helpers/useStore";

const BeforeSignInLinks = {
  "About us": "/about",
};

const AfterSignInLinks = {
  "Users" : "/online-users",
  "About us": "/about",
};

function NavBar() {
  const { signout } = useStore();
  const isSignedIn = useStore((state) => state.isSignedIn);

  function handleSignout() {
    signout();
  }

  return (
    <>
      <Box
        width="100%"
        height="50px"
        display="flex"
        alignItems="center"
        borderBottom={"1px solid"}
        borderBottomColor={"black"}
        gap={5}
        px={"4px"}
      >
        <h2>
          {" "}
          <a href="/" style={{ textDecoration: "none", color: "inherit" }}>
            {" "}
            Home{" "}
          </a>{" "}
        </h2>

        {!isSignedIn ? 
          Object.entries(BeforeSignInLinks).map(([tag, path]) => (
            <a href={path} style={{ textDecoration: "none", color: "inherit" }} > {" "}{tag}{" "} </a>
          ))
          : 
          Object.entries(AfterSignInLinks).map(([tag, path]) => (
            <a href={path} style={{ textDecoration: "none", color: "inherit" }} > {" "}{tag}{" "} </a>
          ))
        }

        <Spacer />
        {!isSignedIn ? 
          <Button as={Link} to="/sign-in" size={"sm"}> Sign-in </Button>
          : 
          <Button onClick={handleSignout} size={"sm"}> Sign-out</Button>
        }
      </Box>
    </>
  );
}

export default NavBar;
