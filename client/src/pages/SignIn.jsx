import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  Link,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const currentToken = localStorage.getItem("token");

      const res = await fetch("http://localhost:50136/user-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (currentToken && !data.token) {
        localStorage.removeItem("token");
      }
      if (data.token) {
        navigate('/');
        localStorage.setItem("token", data.token);
        console.log("Login Successfull");
      } else {
        console.log("Error :", data.error);
      }
    } catch (err) {
      console.error("Error found in client login : ", err);
    }
  };

  return (
    <Container maxW="md" centerContent>
      <Box
        p={8}
        width={"120%"}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        mt={10}
      >
        <Heading
          fontFamily={"Times New Roman, time, serif"}
          as="h1"
          size="lg"
          textAlign="center"
          mb={4}
        >
          Sign In
        </Heading>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              placeholder="Enter your username"
              focusBorderColor="blue.500"
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Enter your password"
              focusBorderColor="blue.500"
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <Button onClick={handleLogin} colorScheme="teal" width="full" mt={4}>
            Sign In
          </Button>
        </VStack>
        <Text mt={4} textAlign="center">
          Don't have an account?{" "}
          <Link color={"blue.500"} href="/create-account">
            Create New Account
          </Link>
        </Text>
      </Box>
    </Container>
  );
}