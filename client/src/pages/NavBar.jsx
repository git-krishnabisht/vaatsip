import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useStore } from "../helpers/useStore";

export default function NavBar() {
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();
  const [img, setImg] = useState();
  const [imgToUpload, setImgToUpload] = useState(null);
  const { signout, uploadprofile, connectSocket, disconnectSocket } = useStore();

  const user = useStore((state) => state.user);
  const isSignedIn = useStore((state) => state.isSignedIn);

  const baseURL = import.meta.env.MODE === "development" ? "http://localhost:50136" : "";

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (user) fetchImage();
    return () => {
      if (img) {
        URL.revokeObjectURL(img);
      }
    };
  }, [user]);

  async function fetchImage() {
    try {
      const response = await fetch(`${baseURL}/api/auth/get-pictures/${user}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (response.ok) {
        const imgBlob = await response.blob();
        if (img) {
          URL.revokeObjectURL(img);
        }
        const imgUrl = URL.createObjectURL(imgBlob);
        setImg(imgUrl);
      } else {
        setImg("./default_profile.png");
      }
    } catch (err) {
      console.error("Error fetching profile picture:", err);
      setImg("./default_profile.png");
    }
  }
  
  async function handleSignout() {
    await signout();
  }

  function handleProfileChange() {
    if (!imgToUpload) {
      console.error("No image selected for upload.");
      return;
    }
    uploadprofile(imgToUpload);
    onModalClose();
    window.location.reload();
  }

  const Links = {
    Users: "/get-users",
  };

  return (
    <Box bg={useColorModeValue("gray.50", "gray.900")} px={6} borderBottom="1px" borderColor={useColorModeValue("gray.200", "gray.700")}>
      <Flex h={16} alignItems="center" justifyContent="space-between" mx="auto">
        <HStack spacing={8} alignItems="center">
          <NavLink 
            to="/"
            style={({ isActive }) => ({
              fontWeight: isActive ? 'bold' : 'normal',
              color: isActive ? '#319795' : 'inherit'
            })}
          >
            Home
          </NavLink>
          {isSignedIn && (
            <HStack as="nav" spacing={4} display={{ base: "none", md: "flex" }}>
              {Object.entries(Links).map(([key, link]) => (
                <NavLink
                  key={key}
                  to={link}
                  style={({ isActive }) => ({
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? '#319795' : 'inherit'
                  })}
                >
                  {key}
                </NavLink>
              ))}
            </HStack>
          )}
        </HStack>

        <HStack spacing={4}>
          {!isSignedIn ? (
            <Button
              as={Link}
              to="/sign-in"
              colorScheme="teal"
              size="md"
            >
              Sign-in
            </Button>
          ) : (
            <>
              <Avatar
                as="button"
                onClick={onModalOpen}
                size="sm"
                src={img}
                cursor="pointer"
                _hover={{ opacity: 0.8 }}
              />
              <Button
                onClick={handleSignout}
                colorScheme="teal"
                size="md"
              >
                Sign-out
              </Button>
            </>
          )}
        </HStack>
      </Flex>

      <Modal
        isOpen={isModalOpen}
        onClose={onModalClose}
        isCentered
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Profile Picture</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Upload new image</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImgToUpload(e.target.files[0])}
                py={1}
              />
              <Button
                onClick={handleProfileChange}
                colorScheme="teal"
                mt={4}
                isDisabled={!imgToUpload}
                w="full"
              >
                Update Profile
              </Button>
            </FormControl>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}