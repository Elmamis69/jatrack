import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "./auth.css";

export default function Login() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("Adrián");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") await login(email, pass);
      else await register(name, email, pass);
      window.location.href = "/"; // Applications
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h1 className="authTitle">{mode === "login" ? "Sign in" : "Create account"}</h1>

        <form className="authForm" onSubmit={handleSubmit}>
          {mode === "register" && (
            <input
              className="authInput"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="authInput"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="authInput"
            placeholder="Password"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />

          {error && <div className="authError">{error}</div>}

          <button className="authBtn" type="submit" disabled={loading}>
            {loading ? (mode === "login" ? "Signing in…" : "Creating…") : (mode === "login" ? "Login" : "Register")}
          </button>
        </form>

        <div className="authLink">
          {mode === "login" ? (
            <>No account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("register"); }}>
                Register
              </a>
            </>
          ) : (
            <>Have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); }}>
                Login
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
