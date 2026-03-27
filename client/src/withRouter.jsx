import { useLocation, useNavigate, useParams } from "react-router-dom";

export function withRouter(Component) {
  function Wrapper(props) {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    return <Component {...props} router={{ params, navigate, location }} />;
  }
  Wrapper.displayName = `withRouter(${Component.displayName || Component.name || "Component"})`;
  return Wrapper;
}
