import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { Button } from "../components/Button.jsx";
import { Input } from "../components/Input.jsx";

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, register } = useAuthStore();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-copy">
          <p className="eyebrow">Enterprise Todo</p>
          <h1>Ship work with clarity.</h1>
          <p>Auth, workspaces, tasks, analytics, and notifications in one polished MERN application.</p>
        </div>
        <div className="auth-form-wrap">
          <div className="segmented">
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
              Sign in
            </button>
            <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
              Create account
            </button>
          </div>
          <form className="form-grid" onSubmit={submit}>
            {mode === "register" ? <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /> : null}
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            {error ? <div className="error-banner">{error}</div> : null}
            <Button type="submit" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
