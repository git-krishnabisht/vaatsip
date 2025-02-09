import { Box, Button, Spacer } from "@chakra-ui/react";
import { Link } from "react-router-dom";

const Links = {
  "About us" :  "/about"
}

function NavBar() {
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
      <h2> <a href="/" style={{ textDecoration: "none", color: "inherit"}}> Home </a> </h2>

      {Object.entries(Links).map(([tag, path]) => (
        <a href={path} style={{ textDecoration: "none", color: "inherit" }}> {tag} </a>
      ))}

      <Spacer/>
      <Button as={Link} to="/sign-in" size={"sm"} >
        Sign-in
      </Button>
      </Box>
    </>
  );
}

export default NavBar;
