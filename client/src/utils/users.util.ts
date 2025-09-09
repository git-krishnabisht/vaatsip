export interface User {
  id: number;
  name: string;
  avatar: string | null;
}

const baseURL = import.meta.env.VITE_API_BASE;

export const getUsers = async (): Promise<User[]> => {
  const res = await fetch(`${baseURL}/users/get-users`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = await res.json();
  return data.data as User[];
};
