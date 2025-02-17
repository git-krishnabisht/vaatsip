import { useEffect } from "react";
import { useStore } from "../helpers/useStore";
import { useParams } from "react-router-dom";
import {
  Container,
  Box,
  VStack,
  HStack,
  Heading,
  Image,
  Text,
} from "@chakra-ui/react";
import { Mail, Calendar, User } from "lucide-react";

function ProfileDetailsPage() {
  const userDetails = useStore((state) => state.userDetails);
  const getuserdetails = useStore((state) => state.getuserdetails);
  const { username } = useParams();

  useEffect(() => {
    const fetchUserDetails = async () => {
      await getuserdetails(username);
    };
    fetchUserDetails();
  }, [getuserdetails, username]);

  const formatDOB = (dob) =>
    new Date(dob).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <>
      {userDetails ? (
        <Container maxW="container.xl" py={10}>
          <Box
            w="full"
            borderWidth="1px"
            borderRadius="md"
            boxShadow="md"
            p={6}
            bg="white"
          >
            <VStack spacing={6} align="stretch">
              <HStack spacing={8} align="start">
                <Box>
                  <Image
                    src={userDetails.image}
                    alt={userDetails.username}
                    borderRadius="full"
                    boxSize="150px"
                    objectFit="cover"
                    border="3px solid"
                    borderColor="blue.400"
                  />
                </Box>
                <VStack align="start" spacing={3} flex={1}>
                  <Text fontSize={20}>{userDetails.name}</Text>
                  <Text color="gray.400" fontSize={15}>
                    @{userDetails.username}
                  </Text>
                  <Box
                    px={2}
                    py={1}
                    bg="blue.100"
                    color="blue.600"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <User size={16} />
                    {userDetails.gender}
                  </Box>
                </VStack>
              </HStack>

              <Box h="1px" bg="gray.200" my={4} />

              <VStack spacing={4} align="stretch">
                <HStack>
                  <Mail size={20} color="#3182CE" />
                  <Text fontWeight="medium">Email:</Text>
                  <Text>{userDetails.email}</Text>
                </HStack>

                <HStack>
                  <Calendar size={20} color="#3182CE" />
                  <Text fontWeight="medium">Date of Birth:</Text>
                  <Text>{formatDOB(userDetails.dob)}</Text>
                </HStack>
              </VStack>
            </VStack>
          </Box>
        </Container>
      ) : (
        <Container centerContent py={10}>
          <Text fontSize="lg">Loading...</Text>
        </Container>
      )}
    </>
  );
}

export default ProfileDetailsPage;
