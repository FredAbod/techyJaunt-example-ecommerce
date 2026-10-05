import { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL, api } from "../api";

export default function Signup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [created, setCreated] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/v1/user/signup", { method: "POST", body: form });
      setCreated(true);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/v1/user/verify-otp", {
        method: "POST",
        body: { email: form.email, otp },
      });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="panel page">
      <p className="eyebrow">Join</p>
      <h1>Create an account</h1>
      {created ? (
        <form onSubmit={verify}>
          <p>{message}</p>
          <label>
            Code
            <input value={otp} onChange={(event) => setOtp(event.target.value)} required />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="button" type="submit">
            Verify email
          </button>
          <p className="muted">
            <Link to="/login">Sign in</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={submit}>
          <label>
            First name
            <input name="firstName" value={form.firstName} onChange={update} required />
          </label>
          <label>
            Last name
            <input name="lastName" value={form.lastName} onChange={update} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={update} required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={update}
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="button" type="submit">
            Create account
          </button>
        </form>
      )}
      <a className="button ghost" href={`${API_URL}/api/v1/auth/google`}>
        Continue with Google
      </a>
    </section>
  );
}
