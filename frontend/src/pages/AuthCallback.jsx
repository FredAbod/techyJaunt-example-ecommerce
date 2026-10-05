import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { setToken } from "../auth";

export default function AuthCallback({ onLogin }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/login?error=google", { replace: true });
      return;
    }

    setToken(token);
    api("/api/v1/user/me", { token })
      .then((data) => {
        onLogin(data.user);
        navigate("/", { replace: true });
      })
      .catch(() => navigate("/login?error=google", { replace: true }));
  }, [navigate, onLogin, params]);

  return (
    <section className="panel page">
      <h1>Signing you in</h1>
    </section>
  );
}
