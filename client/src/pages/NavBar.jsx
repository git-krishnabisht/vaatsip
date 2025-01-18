import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
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
    isOpen: isMenuOpen,
    onOpen: onMenuOpen,
    onClose: onMenuClose,
  } = useDisclosure();
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
    <>
      <div>
        <Box bg={useColorModeValue("blackAlpha.100", "blackAlpha.900")} px={4}>
          <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
            <IconButton
              size={"sm"}
              icon={isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
              aria-label={"Open-menu"}
              display={{ md: "none" }}
              onClick={isMenuOpen ? onMenuClose : onMenuOpen}
            />

            {/*for now this icon menu is not working , we will work on this later*/}

            <HStack spacing={8} alignItems={"center"}>
              <NavLink to="/"> Home </NavLink>
              <HStack
                as={"nav"}
                spacing={4}
                display={{ base: "none", md: "flex" }}
              >
                {Object.entries(Links).map(([key, link]) => (
                  <NavLink key={key} to={link}>
                    {key}
                  </NavLink>
                ))}
              </HStack>
            </HStack>
            <Flex alignItems={"center"}>
              {!isSignedIn ? (
                <>
                  <Button
                    as={Link}
                    to={"/sign-in"}
                    variant={"solid"}
                    colorScheme={"teal"}
                    size={"md"}
                    mr={4}
                  >
                    Sign-in
                  </Button>
                </>
              ) : (
                <>
                  <Avatar
                    as="button"
                    onClick={onModalOpen}
                    size="md"
                    src={img}
                    border="2px"
                    marginRight="8px"
                  />

                  <Modal
                    isOpen={isModalOpen}
                    onClose={onModalClose}
                    isCentered
                    size="xl"
                  >
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>Edit Profile</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <FormControl>
                          <FormLabel>Select Image</FormLabel>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImgToUpload(e.target.files[0])}
                          />
                          <Button
                            onClick={handleProfileChange}
                            colorScheme="teal"
                            mt={4}
                            isDisabled={!imgToUpload}
                          >
                            Update Profile
                          </Button>
                        </FormControl>
                      </ModalBody>
                    </ModalContent>
                  </Modal>

                  <Button
                    onClick={handleSignout}
                    variant="solid"
                    colorScheme="teal"
                    size="md"
                    mr={4}
                  >
                    Sign-out
                  </Button>
                </>
              )}
            </Flex>
          </Flex>
        </Box>
      </div>
    </>
  );
}
