// ============================================================
// 6. Typing Indicator Component
// ============================================================
// src/components/messages/TypingIndicator.tsx

interface TypingIndicatorProps {
  users: Array<{ userId: string; username: string }>;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  const getTypingText = () => {
    if (users.length === 0) return "";
    if (users.length === 1) return `${users[0].username} is typing`;
    if (users.length === 2)
      return `${users[0].username} and ${users[1].username} are typing`;
    return `${users[0].username} and ${users.length - 1} others are typing`;
  };

  return (
    <div className="flex items-center px-4 py-2 mb-2">
      <div className="bg-gray-700 rounded-lg px-3 py-2 flex items-center space-x-2">
        <span className="text-sm text-gray-300">{getTypingText()}</span>
        <div className="flex space-x-1">
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
