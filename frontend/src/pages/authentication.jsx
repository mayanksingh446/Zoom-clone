import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import bgImage from "../assets/signinbackground.jpeg";
import { AuthContext } from "../contexts/AuthContext";
import Snackbar from "@mui/material/Snackbar";
import { useNavigate, useSearchParams } from "react-router-dom";

const defaultTheme = createTheme();

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formState, setFormState] = React.useState(
    searchParams.get("mode") === "register" ? 1 : 0
  );

  const handleAuth = async () => {
    try {
      if (!username.trim() || !password || (formState === 1 && !name.trim())) {
        setError(
          formState === 1
            ? "Name, username and password are required"
            : "Username and password are required"
        );
        setOpen(false);
        return;
      }

      if (formState === 0) {
        let result = await handleLogin(username, password);
        setMessage(result || "Login successful");
        setOpen(true);
        const meetingId =
          typeof window.crypto?.randomUUID === "function"
            ? window.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        navigate(`/meeting-${meetingId}`);
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        console.log(result);
        setUsername("");
        setName("");
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(0);
        setPassword("");
      }

      // your login API here
    } catch (err) {
       let message = err.response?.data?.message || "Something went wrong";
        setError(message);
        setOpen(false);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container component="main" sx={{ height: "100vh" }}>
        <CssBaseline />

        <Grid
          size={{ xs: 12, sm: 4, md: 7 }}
          sx={{
            minHeight: "100vh",
            backgroundImage: `
      linear-gradient(
        rgba(0,0,0,0.3),
        rgba(0,0,0,0.3)
      ),
      url(${bgImage})
    `,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <Grid
          size={{ xs: 12, sm: 8, md: 5 }}
          component={Paper}
          elevation={6}
          square
        >
          <Box
            sx={{
              height: "100vh",
              px: 6,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
              <LockOutlinedIcon />
            </Avatar>

            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                borderRadius: "10px",
                padding: "5px",
                width: "250px",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                    setFormState(0);
                    setError("");
                    setMessage("");
                    setUsername("");
                    setPassword("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  borderRadius: "8px",
                  background: formState === 0 ? "#1976d2" : "transparent",
                  color: formState === 0 ? "white" : "#333",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                Sign In
              </button>

              <button
                onClick={() => {
                setFormState(1);
                setError("");
                setMessage("");
                setUsername("");
                setPassword("");
                setName("");
            }}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  borderRadius: "8px",
                  background: formState === 1 ? "#1976d2" : "transparent",
                  color: formState === 1 ? "white" : "#333",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                Sign Up
              </button>
            </div>

            <Box
              component="form"
              noValidate
              sx={{
                mt: 3,
                width: "100%",
                maxWidth: "500px",
              }}
            >
              {formState === 1 ? (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Full name"
                  name="Full name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : (
                <></>
              )}
              <TextField
                margin="normal"
                required
                fullWidth
                label="Username"
                name="Username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <p style={{ color: "red" }}>{error}</p>}

              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 2 }}
                onClick={handleAuth}
              >
                {formState === 0 ? "Login" : "Register"}
              </Button>

              <Grid container></Grid>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
            open={open}
            autoHideDuration={4000}
            message={message}
            onClose={() => setOpen(false)}
            />
    </ThemeProvider>
  );
}
