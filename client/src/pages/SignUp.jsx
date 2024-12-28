import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  VStack,
} from "@chakra-ui/react";
import { Radio, RadioGroup } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../helpers/useStore";

export default function SignUp() {
  const navigate = useNavigate();
  const { signup } = useStore();
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    gender: "",
    dob: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleRegister = async () => {
    await signup(formData);
    const isSignedUp = useStore.getState().isSignedUp;
    if (isSignedUp) {
      navigate("/");
    }
  };

  return (
    <>
      <Container maxW="md" centerContent>
        <Box
          p={8}
          width={"160%"}
          borderWidth={1}
          borderRadius={"lg"}
          boxShadow={"lg"}
          mt={10}
        >
          <Heading
            fontFamily={"Times New Roman, time, serif"}
            as="h1"
            size={"lg"}
            textAlign={"center"}
            mb={"4"}
          >
            Create Account
          </Heading>
          <VStack spacing={"4"} align={"stretch"}>
            <FormControl isRequired>
              <FormLabel>Username</FormLabel>
              <Input
                height={"50px"}
                type="text"
                name="username"
                value={formData.username}
                placeholder="Username"
                focusBorderColor="blue.500"
                onChange={handleChange}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                height={"50px"}
                type="text"
                name="name"
                value={formData.name}
                placeholder="Name"
                focusBorderColor="blue.500"
                onChange={handleChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>E-mail</FormLabel>
              <Input
                height={"50px"}
                type="email"
                name="email"
                value={formData.email}
                placeholder="E-Mail"
                focusBorderColor="blue.500"
                onChange={handleChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Gender</FormLabel>
              <RadioGroup
                value={formData.gender}
                onChange={(value) =>
                  handleChange({ target: { name: "gender", value } })
                }
              >
                <Stack direction="row">
                  <Radio value="Male">Male</Radio>
                  <Radio value="Female">Female</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Date of birth</FormLabel>
              <Input
                height={"50px"}
                type="date"
                name="dob"
                value={formData.dob}
                placeholder="dob"
                focusBorderColor="blue.500"
                onChange={handleChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                height={"50px"}
                type="password"
                name="password"
                value={formData.password}
                placeholder="Password"
                focusBorderColor="red.500"
                onChange={handleChange}
              />
            </FormControl>

            <Button
              onClick={handleRegister}
              colorScheme="teal"
              width={"full"}
              mt={"4"}
            >
              Submit
            </Button>
          </VStack>
        </Box>
      </Container>
    </>
  );
}
