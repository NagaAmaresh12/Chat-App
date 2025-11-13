import React from "react";
import { useAppSelector } from "@/redux/hooks";

const UserDetails = () => {
  const { selectedUser } = useAppSelector((state) => state.chat);

  if (!selectedUser)
    return <div className="p-4">Select a user to view info</div>;

  return (
    <div className="p-6">
      <img
        src={selectedUser.avatar}
        alt={selectedUser.name}
        className="w-24 h-24 rounded-full mb-4"
      />
      <h2 className="text-xl font-bold">{selectedUser.name}</h2>
      <p className="text-gray-500">{selectedUser.bio}</p>
      <p className="text-gray-400 text-sm">ID: {selectedUser.id}</p>
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Say Hi
      </button>
    </div>
  );
};

export default UserDetails;
