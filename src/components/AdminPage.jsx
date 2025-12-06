import React, { useState, useEffect } from "react";
import socket from "../socket"; // Singleton socket instance

function AdminPage() {
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Force reconnection as admin
    socket.io.opts.query = { isAdmin: "true" };
    socket.disconnect().connect();

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
      // Optional: Reset socket to user mode on unmount if needed, but simple reload fixes it for now.
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
    <div className="flex flex-col h-[75vh] w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-card overflow-hidden border border-white/50">
      <div className="flex h-full">
        {/* Sidebar: Active Chats */}
        <div className="w-1/3 bg-gray-50/50 border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-white">
            <h2 className="text-xl font-bold text-dark flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
              </span>
              Active Sessions
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeChats.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-20 text-gray-400 gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">📭</div>
                <p className="text-sm">No active chats</p>
              </div>
            )}
            {activeChats.map((chat, index) => (
              <div
                key={index}
                onClick={() => handleChatClick(chat)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${selectedChat === chat
                  ? "bg-white border-primary shadow-sm ring-1 ring-primary/20"
                  : "bg-transparent border-transparent hover:bg-white hover:border-gray-100 hover:shadow-sm"
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold text-sm ${selectedChat === chat ? 'text-dark' : 'text-gray-600'}`}>
                    User {index + 1}
                  </span>
                  <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-mono font-bold">
                    #{chat.slice(0, 4)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">ID: {chat}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="w-2/3 flex flex-col bg-white relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#33CEC5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-6 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    Live Session
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">Connected: {selectedChat}</p>
                </div>
                <button className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider">
                  End Session
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 z-10">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex w-full ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative max-w-[75%] px-6 py-4 shadow-sm text-sm leading-relaxed ${msg.sender === "admin"
                        ? "bg-gradient-to-r from-secondary to-teal-400 text-white rounded-2xl rounded-br-none"
                        : "bg-gray-50 text-gray-700 border border-gray-100 rounded-2xl rounded-bl-none"
                        }`}
                    >
                      <p className="text-[15px]">{msg.message}</p>
                      <div className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide opacity-70 ${msg.sender === "admin" ? "text-white text-right" : "text-gray-400 text-left"
                        }`}>
                        {msg.sender === "admin" ? "You" : "User"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-gray-100 z-10">
                <div className="flex items-center gap-3 bg-gray-50 p-2 pr-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-secondary/20 focus-within:border-secondary transition-all shadow-sm">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your reply..."
                    className="flex-1 bg-transparent border-none outline-none px-4 text-gray-700 placeholder-gray-400 min-w-0"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-xl shadow-md transition-all duration-200 ${newMessage.trim()
                      ? "bg-dark hover:bg-black text-white hover:scale-105 active:scale-95"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 pl-0.5">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-50">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-400">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
