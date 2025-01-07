import { useParams } from "react-router-dom";
import { useStore } from "../helpers/useStore";
import { useEffect, useState } from "react";
import { fileTypeFromBuffer } from "file-type";
import { Button, HStack, Input } from "@chakra-ui/react";
import { ArrowBackIcon, AttachmentIcon } from "@chakra-ui/icons";

export default function ChatContainer() {
  const { receiver } = useParams();
  const { getMessages, listenToMessages, muteMessages } = useStore();
  const messages = useStore((state) => state.messages);
  const [incMessages, setMessage] = useState([]);
  const currentUser = useStore((state) => state.user);

  useEffect(() => {
    getMessages(receiver);

    return () => muteMessages();
  }, [receiver, getMessages, listenToMessages, muteMessages]);

  useEffect(() => {
    const processMessages = async () => {
      if (!Array.isArray(messages)) return;
      const messagePromise = messages.map(async (msg) => {
        let imageSrc = null;

        if (msg.image_data && msg.image_data.data) {
          const imageBuffer = new Uint8Array(msg.image_data.data);
          const mimeType = await fileTypeFromBuffer(imageBuffer);
          const blob = new Blob([imageBuffer], {
            type: mimeType.mime || "application/octet-stream",
          });
          imageSrc = URL.createObjectURL(blob);
        }
        return {
          ...msg,
          imageSrc,
        };
      });
      const processed = await Promise.all(messagePromise);
      setMessage(processed);
    };
    processMessages();
  }, [messages]);

  return (
    <>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, padding: "10px" }}>
          {incMessages.map((msg, index) => (
            <div
              key={index}
              style={{
                padding: "10px",
                maxWidth: "300px",
                margin: "0 auto",
                textAlign: msg.sender === currentUser ? "right" : "left",
                marginLeft: msg.sender === currentUser ? "auto" : "0",
                marginRight: msg.sender === currentUser ? "0" : "auto",
              }}
            >
              <div
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <p>
                  <strong>From: </strong> {msg.sender}
                </p>
                {msg.imageSrc && (
                  <div style={{ margin: "10px 0" }}>
                    <img
                      src={msg.imageSrc}
                      alt="Attached"
                      style={{ width: "100%", borderRadius: "5px" }}
                    />
                  </div>
                )}
                <p>
                  <strong>Message:</strong> {msg.message}
                </p>
                <p style={{ fontSize: "12px", color: "#666" }}>
                  <strong>Timestamp:</strong>{" "}
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "sticky",
            bottom: 0,
            padding: "10px",
            borderTop: "1px solid #ccc",
            backgroundColor: "#fff",
            zIndex: 1000,
          }}
        >
          <HStack>
            <Input placeholder="send-message" />
            <Button>
              <AttachmentIcon />
            </Button>
            <Button>
              <ArrowBackIcon />
            </Button>
          </HStack>
        </div>
      </div>
    </>
  );
  
}
