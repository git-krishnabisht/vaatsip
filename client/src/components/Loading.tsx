import { MessageSquare, Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg" | "fullscreen";
  variant?: "spinner" | "dots" | "pulse" | "logo";
}

function Loading({
  message = "Loading...",
  size = "md",
  variant = "spinner",
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    fullscreen: "w-12 h-12",
  };

  const containerClasses = {
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    fullscreen: "min-h-screen",
  };

  if (size === "fullscreen") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6 p-8">
          {/* Animated Logo */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-blue-200 rounded-2xl animate-ping opacity-75"></div>
          </div>

          {/* Loading Animation */}
          {variant === "dots" ? (
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          ) : (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          )}

          {/* Loading Text */}
          <div className="text-center space-y-2">
            <p className="text-gray-700 font-medium">Loading Vaatsip</p>
            <p className="text-gray-500 text-sm">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${containerClasses[size]}`}
    >
      <div className="flex flex-col items-center space-y-3">
        {variant === "spinner" && (
          <Loader2
            className={`${sizeClasses[size]} text-blue-500 animate-spin`}
          />
        )}

        {variant === "dots" && (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        )}

        {variant === "pulse" && (
          <div
            className={`${sizeClasses[size]} bg-blue-500 rounded-full animate-pulse`}
          ></div>
        )}

        {variant === "logo" && (
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 rounded-lg animate-ping opacity-75"></div>
          </div>
        )}

        {message && size !== "sm" && (
          <p className="text-gray-600 text-sm font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}

export default Loading;
