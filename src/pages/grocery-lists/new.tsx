import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NewGroceryListPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the main grocery lists page
    navigate("/grocery-lists");
  }, [navigate]);
  
  return null;
}
