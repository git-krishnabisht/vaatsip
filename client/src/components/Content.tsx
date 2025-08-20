import type { User } from "../utils/get-users.util";

interface ContentProps {
  selectedUser: User | null;
}

function Content({ selectedUser }: ContentProps) {
  if (!selectedUser) {
    return <div className="p-4">Select a user to start chatting</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{selectedUser.name}'s messages</h2>
      <div className="text-gray-600">
        No conversation yet. Start a new chat with {selectedUser.name}.
      </div>
    </div>
  );
}

export default Content;

