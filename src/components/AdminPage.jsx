import React, { useState, useEffect } from "react";
import socket from "../socket"; // Singleton socket instance

function AdminPage() {
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    socket.on("active_chats", (chats) => {
      setActiveChats(chats);
    });

    socket.on("message", (msg) => {
      if (msg.id === selectedChat) {
        setMessages((prevMessages) => [...prevMessages, msg]);
      }
    });

    socket.on("chat_history", ({ chatId, history }) => {
      if (chatId === selectedChat) {
        setMessages(history); // Load chat history into the messages state
      }
    });

    return () => {
      socket.off("active_chats");
      socket.off("message");
      socket.off("chat_history");
    };
  }, [selectedChat]);

  const handleChatClick = (chatId) => {
    setSelectedChat(chatId);
    socket.emit("fetch_chat", chatId); // Request chat history from server
  };

  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    const msgObj = { id: selectedChat, message: newMessage, sender: "admin" };
    socket.emit("message", msgObj); // Send the message
    setMessages((prevMessages) => [...prevMessages, msgObj]); // Update local state
    setNewMessage("");
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Live Chats</h2>
          <ul className="list-disc pl-6">
            {activeChats.map((chat, index) => (
              <li
                key={index}
                className="cursor-pointer text-blue-500 underline"
                onClick={() => handleChatClick(chat)}
              >
                Chat ID: {chat}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Messages for Chat: {selectedChat || "Select a Chat"}
          </h2>
          {selectedChat && (
            <div>
              <div className="h-64 overflow-y-scroll border p-2 mb-4">
                {messages.map((msg, index) => (
                  <p
                    key={index}
                    className={`p-2 my-2 rounded ${
                      msg.sender === "admin" ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    {msg.message}{" "}
                    <span className="text-xs text-gray-500">
                      ({msg.sender || "user"})
                    </span>
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
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
