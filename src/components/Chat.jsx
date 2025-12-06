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
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-card overflow-hidden border border-white/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-yellow-300 p-6 shadow-md z-10 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dark tracking-wide">Live Support</h2>
          <p className="text-dark/70 text-xs font-mono mt-1">Chat ID: {chatId}</p>
        </div>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">👋</div>
            <p>Start a conversation with us!</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative max-w-[80%] px-6 py-4 shadow-sm text-sm leading-relaxed transition-all duration-200 ${msg.sender === "user"
                ? "bg-secondary text-white rounded-2xl rounded-br-none"
                : "bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-none"
                }`}
            >
              <p className="text-[15px]">{msg.message}</p>
              <div className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide opacity-70 ${msg.sender === "user" ? "text-right text-teal-100" : "text-left text-gray-400"
                }`}>
                {msg.sender === "user" ? "You" : "Support"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all duration-300">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none outline-none px-4 text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full shadow-lg transition-all duration-200 ${newMessage.trim()
              ? "bg-blue-500 hover:bg-blue-600 text-white hover:scale-105 active:scale-95"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 pl-0.5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
