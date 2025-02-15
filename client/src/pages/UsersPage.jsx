import { useEffect } from "react";
import { useStore } from "../helpers/useStore";
import {
  Box,
  HStack,
  Image,
  Text,
  VStack,
  Container,
  Stack,
  Spacer,
  Button,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/dialog";

function UsersPage() {
  const { getusers } = useStore();
  const users = useStore((state) => state.users);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      await getusers();
    };
    fetchUsers();
  }, [getusers]);

  function handleClickOne() {
    navigate("/chat");
  }

  function handleViewProfile(username) {
    navigate(`/profile/${username}`);
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        {users.map((user, index) => (
          <Box
            key={user.username || index}
            borderRadius="20px"
            boxShadow="sm"
            transition="all 0.2s"
            _hover={{
              transform: "translateY(-1px)",
              boxShadow: "sm",
              bg: "gray.100",
            }}
          >
            <HStack spacing={4} p={4} align="center">
              <Box position="relative">
                <DialogRoot placement="center" motionPreset="slide-in-bottom">
                  <DialogTrigger asChild>
                    <Image
                      src={user.image}
                      alt={user.username}
                      boxSize="50px"
                      borderRadius="20px"
                      objectFit="cover"
                      border="3px solid"
                      borderColor={"green.500"}
                      cursor="pointer"
                    />
                  </DialogTrigger>
                  <DialogContent width="80%" height="30%">
                    <DialogHeader>
                      <DialogTitle textTransform="uppercase">
                        {" "}
                        {user.username}{" "}
                      </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                      <VStack spacing={4}>
                        <DialogRoot placement="center">
                          <DialogTrigger asChild>
                            <Button width={"100%"}>View Profile Picture</Button>
                          </DialogTrigger>
                          <DialogContent
                            width="90vw"
                            maxWidth="500px"
                            maxHeight="80vh"
                          >
                            <DialogHeader>
                              <DialogTitle textTransform="uppercase">
                                {user.username}'s Profile Picture
                              </DialogTitle>
                            </DialogHeader>
                            <DialogBody
                              m="10px"
                              display="flex"
                              justifyContent="center"
                            >
                              <Box
                                width="100%"
                                display="flex"
                                justifyContent="center"
                              >
                                <Image
                                  src={user.image}
                                  alt={user.username}
                                  maxWidth="100%"
                                  maxHeight="60vh"
                                  objectFit="contain"
                                />
                              </Box>
                            </DialogBody>
                            <DialogFooter>
                              <DialogActionTrigger asChild>
                                <Button variant="outline">Close</Button>
                              </DialogActionTrigger>
                            </DialogFooter>
                          </DialogContent>
                        </DialogRoot>
                        <Button
                          width={"100%"}
                          onClick={() => handleViewProfile(user.username)}
                        >
                          View Profile Details
                        </Button>
                      </VStack>
                    </DialogBody>
                    <DialogFooter>
                      <DialogActionTrigger asChild>
                        <Button variant="outline">Close</Button>
                      </DialogActionTrigger>
                    </DialogFooter>
                  </DialogContent>
                </DialogRoot>
                <Box
                  position="absolute"
                  bottom="0"
                  right="0"
                  w="12px"
                  h="12px"
                  bg="green.500"
                  borderRadius="full"
                  border="2px solid white"
                />
              </Box>
              <Stack align="start">
                <Text fontWeight="500" fontSize="md" textTransform="uppercase">
                  {user.username}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Active now
                </Text>
              </Stack>
              <Spacer />
              <Button
                variant={"subtle"}
                rounded={"10px"}
                onClick={handleClickOne}
              >
                Chat
              </Button>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Container>
  );
}

export default UsersPage;
