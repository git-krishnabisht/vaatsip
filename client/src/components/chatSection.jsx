import { Box, Text, Image, Flex } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

function ChatSection({ messages, sender, receiver }) {
  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom of container on new messages
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  return (
    <Box
      ref={containerRef}
      height="100%"
      bg="gray.100"
      display="flex"
      flexDirection="column"
      overflowY="auto"
      p={4}
      pb={10}
    >
      {messages.map((msg, index) => (
        <Flex
          key={index}
          justify={msg.sender === sender ? "flex-end" : "flex-start"}
          mb={2}
        >
          <Box
            maxW="80%"
            bg={msg.sender === sender ? "gray.400" : "gray.300"}
            color="black"
            p={3}
            borderRadius="lg"
            wordBreak="break-word"
          >
            <Text
              fontSize="sm"
              fontWeight="bold"
              textAlign={msg.sender === sender ? "right" : "left"}
            >
              {msg.sender === sender ? sender : receiver}
            </Text>
            {msg.image_data && (
              <Image
                src={msg.image_data}
                alt="Attached"
                borderRadius="md"
                maxW="100%"
                my={2}
              />
            )}
            <Text>{msg.message}</Text>
            <Text fontSize="xs" textAlign="right">
              {new Date(msg.created_at).toLocaleString()}
            </Text>
          </Box>
        </Flex>
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
}

export default ChatSection;