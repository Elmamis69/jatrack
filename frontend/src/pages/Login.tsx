import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("Adrián");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") await login(email, pass);
      else await register(name, email, pass);
      window.location.href = "/"; // a Applications
    } catch (err: any) {
      setError(err.message || "Error");
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "80px auto", padding: 16, border: "1px solid #e5e5e5", borderRadius: 12 }}>
      <h2 style={{ marginBottom: 16 }}>{mode === "login" ? "Sign in" : "Create account"}</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        {mode === "register" && (
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} required />
        {error && <div style={{ color: "crimson" }}>{error}</div>}
        <button type="submit">{mode === "login" ? "Login" : "Register"}</button>
      </form>
      <div style={{ marginTop: 12 }}>
        {mode === "login" ? (
          <span>
            No account?{" "}
            <a href="#" onClick={() => setMode("register")}>
              Register
            </a>
          </span>
        ) : (
          <span>
            Have an account?{" "}
            <a href="#" onClick={() => setMode("login")}>
              Login
            </a>
          </span>
        )}
      </div>
    </div>
  );
}
