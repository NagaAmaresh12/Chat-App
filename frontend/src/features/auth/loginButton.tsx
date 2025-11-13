import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const loginButton = () => {
  return (
    <Button variant={"outline"} asChild>
      <Link to="/login">Login</Link>
    </Button>
  );
};

export default loginButton;
