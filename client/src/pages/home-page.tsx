import { useEffect } from "react";
import { useLocation } from "wouter";

const HomePage = () => {
  const [, navigate] = useLocation();

  // Redirect to the service request page immediately
  useEffect(() => {
    navigate('/request-service');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-black">Redirecting to service request form...</h1>
      </div>
    </div>
  );
};

export default HomePage;
