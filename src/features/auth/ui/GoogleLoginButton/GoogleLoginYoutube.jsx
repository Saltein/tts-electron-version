import { useSelector } from "react-redux";
import { DefaultButton } from "../../../../shared/ui";
import s from "./GoogleLoginYouTube.module.scss";
import { useEffect, useState, useCallback } from "react";
import { selectYoutubeAccessToken } from "../../../../entities/connection/model/slice";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const OAUTH_PORT = 3456;
const REDIRECT_URI = `http://127.0.0.1:${OAUTH_PORT}/oauth2callback`;
const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"].join(" ");

const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
};

const generateCodeChallenge = async (codeVerifier) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
};

export const GoogleLoginYouTube = ({ onAccessToken }) => {
    const youtubeAccessToken = useSelector(selectYoutubeAccessToken);
    const [loading, setLoading] = useState(false);
    const [isAlreadySignIn, setIsAlreadySignIn] =
        useState(!!youtubeAccessToken);

    const exchangeCodeForToken = useCallback(
        async (code, codeVerifier) => {
            try {
                const tokenUrl = "https://oauth2.googleapis.com/token";
                const params = new URLSearchParams({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET, // добавить
                    redirect_uri: REDIRECT_URI,
                    grant_type: "authorization_code",
                    code,
                    code_verifier: codeVerifier,
                });

                const response = await fetch(tokenUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: params.toString(),
                });

                const data = await response.json();

                if (data.access_token) {
                    if (onAccessToken && typeof onAccessToken === "function") {
                        onAccessToken(data.access_token);
                    }
                    return data.access_token;
                } else {
                    console.error("Token exchange failed:", data);
                    throw new Error("Failed to get access token");
                }
            } catch (error) {
                console.error("Error exchanging code for token:", error);
                throw error;
            }
        },
        [onAccessToken],
    );

    const handleOAuthCode = useCallback(
        async (code) => {
            const savedVerifier = sessionStorage.getItem(
                "google_code_verifier",
            );
            if (savedVerifier) {
                try {
                    await exchangeCodeForToken(code, savedVerifier);
                } finally {
                    setLoading(false);
                    sessionStorage.removeItem("google_code_verifier");
                }
            } else {
                setLoading(false);
            }
        },
        [exchangeCodeForToken],
    );

    useEffect(() => {
        const unsubscribe = window.electronAPI.onGoogleOAuthCode((code) => {
            handleOAuthCode(code);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [handleOAuthCode]);

    const handleLogin = async () => {
        setLoading(true);

        try {
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            sessionStorage.setItem("google_code_verifier", codeVerifier);

            const authUrl =
                `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${CLIENT_ID}` +
                `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent(SCOPES)}` +
                `&include_granted_scopes=true` +
                `&prompt=consent` +
                `&code_challenge=${codeChallenge}` +
                `&code_challenge_method=S256`;

            window.electronAPI.openExternal(authUrl); // Теперь это надёжный IPC-вызов

            setTimeout(() => {
                if (loading) setLoading(false);
            }, 120000);
        } catch (error) {
            console.error("Login error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsAlreadySignIn(!!youtubeAccessToken);
    }, [youtubeAccessToken]);

    return (
        <div className={s.wrapper}>
            <DefaultButton
                title={
                    loading
                        ? "Загрузка..."
                        : isAlreadySignIn
                          ? "Вы уже вошли через Google"
                          : "Войти через Google"
                }
                color={"rgba(225, 0, 45, 0.9)"}
                onClick={handleLogin}
                active={!isAlreadySignIn && !loading}
                flex={"2"}
            />
            {isAlreadySignIn && !loading && (
                <DefaultButton
                    title={"Перезайти"}
                    flex={"1"}
                    onClick={handleLogin}
                />
            )}
        </div>
    );
};
