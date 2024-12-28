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
  const { signout, uploadprofile } = useStore();

  const user = useStore.getState().user;
  const isSignedIn = useStore.getState().isSignedIn;

  const onlineUsers = useStore.getState().onlineUsers; //okay , it has all the online users we can work with :-)


  useEffect(() => {
    async function fetchImage() {
      try {
        const response = await fetch(
          `http://localhost:50136/get-pictures/${user}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const imgBlob = await response.blob();
          const imgUrl = URL.createObjectURL(imgBlob);
          setImg(imgUrl);
        } else {
          console.error("Failed to fetch the image");
        }
      } catch (err) {
        console.error("Error : ", err);
      }
    }
    if (user) fetchImage();
  }, [user]);

  async function handleSignout() {
    await signout();
  }

  async function handleProfileChange() {
    await uploadprofile(imgToUpload);
  }

  const Links = {
    Users: "/get-users",
    Game: "/tic-tac-toe",
  };

  return (
    <>
      <Box bg={useColorModeValue("blackAlpha.100", "blackAlpha.900")} px={4}>
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <IconButton
            size={"sm"}
            icon={isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={"Open-menu"}
            display={{ md: "none" }}
            onClick={isMenuOpen ? onMenuClose : onMenuClose}
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
                        >
                          Update Profile
                        </Button>
                      </FormControl>
                    </ModalBody>
                    <ModalFooter>
                      <Button onClick={onModalClose} colorScheme="gray">
                        Close
                      </Button>
                    </ModalFooter>
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
    </>
  );
}
