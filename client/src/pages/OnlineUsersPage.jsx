import { useEffect } from "react";
import { useStore } from "../helpers/useStore";
import {
  Box,
  HStack,
  Image,
  Text,
  VStack,
  Container,
} from "@chakra-ui/react";

function OnlineUsersPage() {
  const { getusers } = useStore();
  const users = useStore((state) => state.users);

  useEffect(() => {
    const fetchUsers = async () => {
      await getusers();
    };
    fetchUsers();
  }, [getusers]);

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch" >
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
              spacing={4}
              p={4}
              align="center"
            >
              <Box position="relative">
                <Image
                  src={user.image}
                  alt={user.username}
                  boxSize="50px"
                  borderRadius="20px"
                  objectFit="cover"
                  border="3px solid"
                  borderColor={"green.500"}
                />
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
              <VStack align="start">
                <Text
                  fontWeight="500"
                  fontSize="md"
                  textTransform="uppercase"
                >
                  {user.username}
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.500"
                >
                  Active now
                </Text>
              </VStack>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Container>
  );
}

export default OnlineUsersPage;