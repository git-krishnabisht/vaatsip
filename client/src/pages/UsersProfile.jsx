import { useEffect } from "react";
import { useStore } from "../helpers/useStore.js";

export default function UsersProfile() {
  const { getuserdetails } = useStore();
  const userDetails = useStore((state) => state.userDetails);

  useEffect(() => {
    getuserdetails();
  }, [getuserdetails]);
  
  return (
    <>
      <p>This is the user's profile</p>
    </>
  );
}
