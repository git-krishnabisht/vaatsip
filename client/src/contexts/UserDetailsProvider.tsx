import { createContext, useContext, useState, type ReactNode } from "react";
import type { User } from "../utils/get-users.util";

interface UserDetailsContextType {
  userDetails: User | null;
  setUserDetails: (user: User | null) => void;
}

const UserDetailsContext = createContext<UserDetailsContextType | undefined>(undefined);

export function UserDetailsProvider({ children }: { children: ReactNode }) {
  const [userDetails, setUserDetails] = useState<User | null>(null);

  return (
    <UserDetailsContext.Provider value={{ userDetails, setUserDetails }}>
      {children}
    </UserDetailsContext.Provider>
  );
}

export function useUserDetails() {
  const context = useContext(UserDetailsContext);
  if (!context) throw new Error("useUserDetails must be used within UserDetailsProvider");
  return context;
}

