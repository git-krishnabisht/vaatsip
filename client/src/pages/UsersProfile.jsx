import { useEffect } from "react";
import { useStore } from "../helpers/useStore.js";
import { useParams } from "react-router-dom";

export default function UsersProfile() {
  const { getuserdetails, userDetails } = useStore(); 
  const { user } = useParams(); 

  useEffect(() => {
    if (user) {
      getuserdetails(user); 
    }
  }, [getuserdetails, user]);

  return (
    <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "5px" }}>
      <h1>User Profile</h1>
      {userDetails ? (
        <p>
          <strong>Name:</strong> {userDetails.name} <br />
          <strong>Username:</strong> {userDetails.username} <br />
          <strong>Email:</strong> {userDetails.email} <br />
          <strong>Date of Birth:</strong> {userDetails.dob || "N/A"}
        </p>
      ) : (
        <p>No user details available.</p>
      )}
    </div>
  );
}
