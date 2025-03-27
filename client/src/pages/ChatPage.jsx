import { Button, Container, HStack, Input, VStack, Text, Box } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { socketService } from "../services/socketService";
import { useParams } from "react-router-dom";
import { userService } from "../services/userService";

function ChatPage() {
  const { initializeSocket, connectSocket, sendMessage, message: socketMessages, getMessages } = socketService();
  const { user, getuser } = userService();
  const [outgoingMessages, setOutgoingMessages] = useState({
    message: "",
    image_data: {},
    sender: "",
    receiver: "",
    created_at: "",
  });
  const receiver = useParams();
  const [chatMessages, setChatMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const baseURL = import.meta.env.MODE === "development" ? "http://localhost:50136" : "";

  const fetchExistingMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch(
        `${baseURL}/api/messages/get-messages/${receiver.username}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      } else {
        console.error("Error fetching messages:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      getuser();
    }
    
    if (user && user.username) {
      initializeSocket(user.username);
      connectSocket();
    }
    
    fetchExistingMessages();
    
    return () => {
      const { disconnectSocket } = socketService.getState();
      disconnectSocket();
    };
  }, [user]);

  useEffect(() => {
    const messages = getMessages();
    if (messages && messages.length > 0) {
      const relevantMessages = messages.filter(
        msg => (msg.sender === user?.username && msg.receiver === receiver.username) || 
               (msg.sender === receiver.username && msg.receiver === user?.username)
      );
      
      if (relevantMessages.length > 0) {
        setChatMessages(prev => {
          const newMessages = [...prev];
          relevantMessages.forEach(msg => {
            if (!newMessages.some(m => 
              m.created_at === msg.created_at && 
              m.sender === msg.sender && 
              m.message === msg.message
            )) {
              newMessages.push(msg);
            }
          });
          return newMessages;
        });
      }
    }
  }, [socketMessages, user, receiver.username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function handleSendMessages() {
    if (outgoingMessages.message && receiver.username) {
      const messageToSend = {
        ...outgoingMessages,
        sender: user?.username,
        receiver: receiver.username,
        created_at: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, messageToSend]);
      
      await sendMessage(messageToSend, receiver.username);
      
      setOutgoingMessages({
        message: "",
        image_data: {},
        sender: "",
        receiver: "",
        created_at: "",
      });
    }
  }

  return (
    <>
      <Container 
        maxW="100%" 
        h="calc(100vh - 140px)" 
        overflowY="auto" 
        py={4}
        px={4}
        bg="gray.50"
        borderRadius="md"
        boxShadow="sm"
      >
        <VStack spacing={4} align="stretch">
          {chatMessages.length === 0 ? (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              height="100%"
              py={10}
            >
              <Text color="gray.500" fontSize="md">
                Start a conversation with {receiver.username}
              </Text>
            </Box>
          ) : (
            chatMessages.map((msg, index) => (
              <Box 
                key={index}
                alignSelf={msg.sender === user?.username ? "flex-end" : "flex-start"}
                bg={msg.sender === user?.username ? "blue.100" : "gray.100"}
                p={3}
                borderRadius={msg.sender === user?.username 
                  ? "15px 15px 0 15px" 
                  : "15px 15px 15px 0"}
                maxW="70%"
                boxShadow="sm"
                position="relative"
              >
                <Text fontSize="sm" fontWeight="bold" color={msg.sender === user?.username ? "blue.600" : "gray.600"}>
                  {msg.sender}
                </Text>
                <Text mt={1}>{msg.message}</Text>
                {msg.image_data && msg.image_data !== '{}' && (
                  <Box mt={2}>
                    <img 
                      src={msg.image_data} 
                      alt="Attachment" 
                      style={{ maxWidth: '100%', borderRadius: '8px' }} 
                    />
                  </Box>
                )}
                <Text 
                  fontSize="xs" 
                  color="gray.500" 
                  textAlign="right"
                  mt={1}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Container>

      <Container
        padding="2vh"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={10}
        bg="white"
        boxShadow="0px -2px 10px rgba(0, 0, 0, 0.05)"
        maxWidth={"100%"}
      >
        <HStack spacing={3}>
          <Input
            placeholder="Type a message..."
            value={outgoingMessages.message}
            onChange={(e) => {
              setOutgoingMessages({
                ...outgoingMessages,
                message: e.target.value,
              });
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessages();
              }
            }}
            borderRadius="full"
            bg="gray.50"
            _focus={{
              borderColor: "blue.400",
              boxShadow: "0 0 0 1px blue.400",
            }}
          />
          <Button 
            onClick={handleSendMessages}
            colorScheme="blue"
            borderRadius="full"
            px={6}
            isDisabled={!outgoingMessages.message.trim()}
          > 
            Send 
          </Button>
        </HStack>
      </Container>
    </>
  );
}

export default ChatPage;
