import { useAuth } from "./AuthContext";

function Dashboard() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div>
      <h1>Welcome to Dashboard!</h1>
      <button 
        onClick={handleLogout}
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
