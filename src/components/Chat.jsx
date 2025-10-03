import React, { useState, useEffect } from "react";
import socket from "../socket"; // Singleton socket instance

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(""); // Store the user's Chat ID

  useEffect(() => {
    // Set the Chat ID when the component mounts
    setChatId(socket.id);

    // Define a handler for new messages
    const handleNewMessage = (data) => {
      // Only add the message if it's not already in the state
      setMessages((prevMessages) => {
        if (!prevMessages.some((msg) => msg.id === data.id && msg.message === data.message)) {
          return [...prevMessages, data];
        }
        return prevMessages; // Avoid duplicates
      });
    };

    // Listen for messages from the server
    socket.on("message", handleNewMessage);

    // Clean up the listener on unmount to avoid duplicates
    return () => {
      socket.off("message", handleNewMessage);
    };
  }, []);

  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    const msgObj = { id: socket.id, message: newMessage, sender: "user" };
    socket.emit("message", msgObj); // Send the message to the server
    setMessages((prevMessages) => [...prevMessages, msgObj]); // Add the message locally
    setNewMessage(""); // Clear the input field
  };

  return (
    <div className="p-6 border rounded shadow-lg mt-28">
      <h2 className="text-2xl font-semibold mb-4">Live Chat</h2>
      <p className="text-gray-500 mb-2">Your Chat ID: {chatId}</p> {/* Display Chat ID */}
      <div className="h-64 overflow-y-scroll border p-2 mb-4">
        {messages.map((msg, index) => (
          <p
            key={index}
            className={`p-2 my-2 rounded ${
              msg.sender === "admin" ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            {msg.message}{" "}
            <span className="text-xs text-gray-500">({msg.sender})</span>
          </p>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type your message..."
        className="border w-full p-2"
      />
      <button
        onClick={sendMessage}
        className="mt-2 bg-green-500 text-white px-4 py-2"
      >
        Send
      </button>
    </div>
  );
}

export default Chat;
