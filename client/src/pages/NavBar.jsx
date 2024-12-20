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
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { Link, NavLink} from "react-router-dom";

const DefaultImg ="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKgAAACUCAMAAAAwLZJQAAAAY1BMVEX///8AAAAEBAT7+/s/Pz/39/cICAh9fX0NDQ3z8/Pf399eXl6WlpbT09MuLi7w8PDDw8OqqqpnZ2c5OTm3t7cXFxfq6upTU1OdnZ0bGxtHR0eGhoaPj4+kpKQhISHLy8tycnIQFVVrAAAErklEQVR4nO2ai5aqOgyGLbXcpNxEUMDL+z/lTlouOlu2OFrKOiffUsZBlN+koUnKZkMQBEEQBEEQBEEQBEEQxP8KrjZc/+13cT68tRJACxd3/95pE3xdUgFUGoRFm1f7fZW3RRh0O9cFWE6EhbdnA3uvCMWDpdcA57ws8gMKdIbNIS9KzlfkeI52C70LY64LEh3XhQ2+ZhcvRFuvRiu497pDIzqO3o4vd9eVDFSuniK9G5yP7FPRHWRdJ1gsrV09LH8CI6BOtUmt+x8EhDsYns+FwkDdhbYlKjBWPFDkP/e8D/o968ZEMJAOXeg8Mym8cbAfUBwVlDlzwfPPXQ++d1leolCbdlXhXMTseST18cQuheW41zHfTIvsaYTtYQrnl9VroZW0fXmCs6fxa6GX1LZQOH/mvhbKMvtCk3aGTtYGlmWCUG+OUC+xrXOT3OYIvVkWCuOunCe0tCt084brbQeTiOYIjYR1oTybyJvu8TPbMoHp5H5kn65AaDhnCrWcO6OZhGiw8GQT8xMmgMxRSYnVwhnPDZP9RMWEQNXE4ivko3ZTZ4GtB0/X81M6XeYJsKbdSVT1HmTM/GnX+yyWugthNaDU6Y9sMsfH3Ud9oG2h8Azy6YBnLA9U0NlU2cFVYT8FlPW8O8w2MABlDgX82HgaXjp+LtfVegy9kx6TvVA9Zk/eOtokGhUn4TnW/ZK+P4o9kvgcWo+iO1QbYsOlMqozRvvJk91bthU+EggZ1WMQ1ZEU9iulR8aJnMus9W43r81kt2NFnu/hP9IOvqKeOEF0QM7HxbCxrea/gUjKMgzLMlnT/I7wMTPi4TWLmlue73Z5fmui7BqOjeZVDAQ0npDnvIpPdzW+f4qr/CzFZg25KA+wDAVbHqvTXVZ/l+2fqiPYFY7ZBHZ7+ODSRDaHUSGmpZ3STu+hkYmapmx6X2ySFJeVVWE/rtX26bMu69nFSxOr/selhmbfyXNRrjPmo+oft1O+b+wuN4ii9pl297jtRwE+WLdlfl1YMin2EcsGZT5frr0Hl26Z35S4YL6wTBUbadVpmAH+miq1EFIwmxfbxyvRC6vCkduCL72EBz7MYh0vs5XCwXG2eOcZdXaxMtugWJZmCw9S1Ol2l/Z5weToS9jSSnHpmz3MPy+kDtu4WEiizkC22F94Y4D2ch2fbZfJU/hws8tMW/6wa3czzAIFKrZkWx1H7+rsP9XyJfpmcIb08k68PwhVSnH1fgnXh5XOk96W2k37DqvCBVzPk/bwC5EPYg9tYv6yL+TQCPtNMGlqucAYjfzfhNGjXj8yX5iEb6UiT3ViemK+EX1UYfSpSfWSjkmSLZta+5oPfEFtusebqvN85nr1S1PDQr3uUviRUHx65jSqLt2/bxh8Q2ucGOtIYyNRfmrOQSiTRku96NNrE+tdzyJjIpGc/TZx+ktsblJnUo9G+UCl+nht7J4tbODMuCNnLntjTR6dibJvRBN+g7F7SvFLz4ePNQ6cMmNhzzdHX5W934D5x40x3/PW+Z5QKJ0MXe/hMeMG8fk0xlJSHhzr7fc4mkqgAtXD+xqCm6pFOf9u/bCqe2IIgiAIgiAIgiAIgiAIgvgafwAJIC5QBmWRZQAAAABJRU5ErkJggg==";

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
  const [img, setImg] = useState(DefaultImg);

  const handleProfileStuff = () => {
    onModalOpen();
  };

  const Links = {
    Users: "/get-users",
    Game: "/tic-tac-toe",
    Click_me_bitch: "/edit-profile",
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
              onClick={handleProfileStuff}
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

            <Modal isOpen={isModalOpen} onClose={onModalClose} isCentered size={"xl"}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Edit-Profile</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  
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
