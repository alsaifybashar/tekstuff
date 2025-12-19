import React, { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (login(username, password)) {
            navigate("/admin");
        } else {
            setError("Ogiltigt användarnamn eller lösenord");
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <Container style={{ maxWidth: "400px" }}>
                <Card className="shadow-lg border-0 rounded-4">
                    <Card.Body className="p-5">
                        <div className="text-center mb-4">
                            <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle mb-3">
                                <Lock size={32} className="text-primary" />
                            </div>
                            <h2 className="fw-bold">Admin Login</h2>
                            <p className="text-muted small">Logga in för att hantera din webbutik</p>
                        </div>

                        {error && <Alert variant="danger">{error}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Användarnamn</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="admin"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="rounded-3 p-3"
                                    autoFocus
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>Lösenord</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="rounded-3 p-3"
                                />
                            </Form.Group>

                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100 py-3 rounded-3 fw-bold"
                                disabled={!username || !password}
                            >
                                Logga in
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
                <div className="text-center mt-4">
                    <a href="/" className="text-decoration-none text-muted small">
                        ← Tillbaka till butiken
                    </a>
                </div>
            </Container>
        </div>
    );
}
