import { useEffect } from "react";
import { useStore } from "../services/useStore";
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
    <>
      {users ? (
        <Container
          maxW={{ base: "100%", md: "90%", lg: "100vh" }}
          py={{ base: 4, md: 8 }}
          px={{ base: 2, md: 4 }}
        >
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
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
                <HStack
                  spacing={{ base: 2, md: 4 }}
                  p={{ base: 2, md: 4 }}
                  align="center"
                >
                  <Box position="relative">
                    <DialogRoot
                      placement="center"
                      motionPreset="slide-in-bottom"
                    >
                      <DialogTrigger asChild>
                        <Image
                          src={user.image}
                          alt={user.username}
                          boxSize={{ base: "40px", md: "50px" }}
                          borderRadius="20px"
                          objectFit="cover"
                          border="3px solid"
                          borderColor="green.500"
                          cursor="pointer"
                        />
                      </DialogTrigger>
                      <DialogContent
                        width={{ base: "90%", md: "80%" }}
                        height={{ base: "auto", md: "30%" }}
                      >
                        <DialogHeader>
                          <DialogTitle
                            textTransform="uppercase"
                            fontSize={{ base: "sm", md: "md" }}
                          >
                            {user.username}
                          </DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                          <VStack spacing={{ base: 2, md: 4 }}>
                            <DialogRoot placement="center">
                              <DialogTrigger asChild>
                                <Button
                                  width="100%"
                                  size={{ base: "sm", md: "md" }}
                                >
                                  View Profile Picture
                                </Button>
                              </DialogTrigger>
                              <DialogContent
                                width={{ base: "95vw", md: "90vw" }}
                                maxWidth={{ base: "90%", md: "500px" }}
                                maxHeight="80vh"
                              >
                                <DialogHeader>
                                  <DialogTitle
                                    textTransform="uppercase"
                                    fontSize={{ base: "sm", md: "md" }}
                                  >
                                    {user.username}'s Profile Picture
                                  </DialogTitle>
                                </DialogHeader>
                                <DialogBody
                                  m={{ base: "5px", md: "10px" }}
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
                                      maxHeight={{ base: "50vh", md: "60vh" }}
                                      objectFit="contain"
                                    />
                                  </Box>
                                </DialogBody>
                                <DialogFooter>
                                  <DialogActionTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size={{ base: "sm", md: "md" }}
                                    >
                                      Close
                                    </Button>
                                  </DialogActionTrigger>
                                </DialogFooter>
                              </DialogContent>
                            </DialogRoot>
                            <Button
                              width="100%"
                              size={{ base: "sm", md: "md" }}
                              onClick={() => handleViewProfile(user.username)}
                            >
                              View Profile Details
                            </Button>
                          </VStack>
                        </DialogBody>
                        <DialogFooter>
                          <DialogActionTrigger asChild>
                            <Button
                              variant="outline"
                              size={{ base: "sm", md: "md" }}
                            >
                              Close
                            </Button>
                          </DialogActionTrigger>
                        </DialogFooter>
                      </DialogContent>
                    </DialogRoot>
                    <Box
                      position="absolute"
                      bottom="0"
                      right="0"
                      w={{ base: "10px", md: "12px" }}
                      h={{ base: "10px", md: "12px" }}
                      bg="green.500"
                      borderRadius="full"
                      border="2px solid white"
                    />
                  </Box>
                  <Stack align="start">
                    <Text
                      fontWeight="500"
                      fontSize={{ base: "sm", md: "md" }}
                      textTransform="uppercase"
                    >
                      {user.username}
                    </Text>
                    <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">
                      Active now
                    </Text>
                  </Stack>
                  <Spacer />
                  <Button
                    variant="subtle"
                    rounded="10px"
                    size={{ base: "sm", md: "md" }}
                    onClick={handleClickOne}
                  >
                    Chat
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Container>
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
}

export default UsersPage;
