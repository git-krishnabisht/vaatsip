import { useEffect } from "react";
import { useStore } from "../helpers/useStore";
import {
  Box,
  HStack,
  Image,
  Text,
  VStack,
  Container,
  Heading,
  Badge,
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
      <VStack spacing={6} align="stretch">
        {users.map((user, index) => (
          <Box
            key={user.username || index}
            bg="gray.50"
            borderRadius="lg"
            boxShadow="sm"
            transition="all 0.2s"
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "md",
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
                  borderRadius="full"
                  objectFit="cover"
                  border="2px solid"
                  borderColor="gray.400"
                />
                <Box
                  position="absolute"
                  bottom="0"
                  right="0"
                  w="12px"
                  h="12px"
                  bg="green.400"
                  borderRadius="full"
                  border="2px solid white"
                />
              </Box>
              <VStack align="start" spacing={1} flex={1}>
                <Text
                  fontWeight="500"
                  fontSize="sm"
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