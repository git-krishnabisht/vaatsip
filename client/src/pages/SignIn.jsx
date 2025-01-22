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
import { useStore } from "../helpers/useStore";

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const { signin, getuser } = useStore();

  const handleLogin = async () => {
    await signin(formData);
    const isSignedIn = useStore.getState().isSignedIn;
    if (isSignedIn) {
      navigate("/");
      await getuser();
      toast.success("Signed-in successfully");
    } else {
      toast.error("Signed-in failed");
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
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Enter your password"
              focusBorderColor="blue.500"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
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
