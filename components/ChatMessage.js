const ChatMessage = ({ message, isUser }) => {
    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div
          className={`${
            isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
          } rounded-lg py-2 px-4 max-w-[70%]`}
        >
          {message}
        </div>
      </div>
    )
  }
  
  export default ChatMessage
  
  