import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <p className="text-xl text-gray-600">
            Oops! The page you're looking for doesn't exist
          </p>
        </div>
        <Button
          asChild
          variant="default"
          className="hover:shadow-md transition-all duration-200"
        >
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
