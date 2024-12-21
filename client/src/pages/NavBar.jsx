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
  const [tempImg, setTempImg] = useState(null);


  useEffect(() => {
    async function fetchImage() {
      try {
        const response = await fetch(
          "http://localhost:50136/get-pictures/rajkumar"
        );
        if(response.ok) {
          const imgBlob = await response.blob();
          const imgUrl = URL.createObjectURL(imgBlob);
          console.log(imgUrl);
          setImg(imgUrl);
        } else {
        }
      } catch (error) {
        console.error("Error fetching image:", error);
      }
    }
    fetchImage();
  }, []);

  const handleProfileChange = async() => {

    const formData = new FormData();
    formData.append("image", tempImg);

    if(!tempImg) {
      throw new Error("Select an Image");
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:50136/edit-profile/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData
      });
      if(!response.ok) {
        console.log("Failed to upload the image");
      } else {
        console.log("Image uploaded successfully");
      }
    } catch(err) {
      console.error("Error: ", err);
    }
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
            <Avatar
              as={"button"}
              onClick={onModalOpen}
              size={"md"}
              src={img}
              border={"2px"}
              marginRight={"8px"}
            />
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

            <Modal
              isOpen={isModalOpen}
              onClose={onModalClose}
              isCentered
              size={"xl"}
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Edit-Profile</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  {/* need to add the feature for uploding picture easy will do in <30mins LFG*/}
                  <FormControl>
                    <FormLabel>Select Image</FormLabel>
                  <Input type="file" onChange={(e) => setTempImg(e.target.files[0])}></Input>
                  <Button onClick={handleProfileChange}> Update profile </Button>
                  </FormControl>
                </ModalBody>
                <ModalFooter>
                  <Button onClick={onModalClose}>Close</Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}
