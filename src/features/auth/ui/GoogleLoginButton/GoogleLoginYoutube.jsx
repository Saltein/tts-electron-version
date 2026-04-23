// GoogleLoginYouTube.jsx
import { useSelector } from "react-redux";
import { DefaultButton } from "../../../../shared/ui";
import s from "./GoogleLoginYouTube.module.scss";
import { useEffect, useState } from "react";
import { selectYoutubeAccessToken } from "../../../../entities/connection/model/slice";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"].join(" ");

// Генерация code_verifier и code_challenge для PKCE
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
    const [isAlreadySignIn, setIsAlreadySignIn] = useState(
        youtubeAccessToken ? true : false,
    );

    const exchangeCodeForToken = async (code, codeVerifier) => {
        try {
            const tokenUrl = "https://oauth2.googleapis.com/token";
            const params = new URLSearchParams({
                client_id: CLIENT_ID,
                redirect_uri: REDIRECT_URI,
                grant_type: "authorization_code",
                code: code,
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
    };

    const handleLogin = async () => {
        setLoading(true);

        try {
            // Генерируем PKCE параметры
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);

            // Сохраняем codeVerifier для последующего обмена
            sessionStorage.setItem("google_code_verifier", codeVerifier);

            // Используем Authorization Code Flow (response_type=code)
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

            const width = 500,
                height = 600;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;
            const authWindow = window.open(
                authUrl,
                "googleLogin",
                `width=${width},height=${height},top=${top},left=${left}`,
            );

            // Функция для обработки редиректа
            const handleRedirect = (event) => {
                // Проверяем, что это наш редирект
                if (event.origin !== window.location.origin) return;

                // Закрываем попап и обрабатываем код
                if (authWindow && !authWindow.closed) {
                    authWindow.close();
                }

                // Получаем код из URL (при редиректе на нашу страницу)
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get("code");
                const error = urlParams.get("error");

                if (code) {
                    const savedVerifier = sessionStorage.getItem(
                        "google_code_verifier",
                    );
                    exchangeCodeForToken(code, savedVerifier)
                        .then(() => {
                            setLoading(false);
                            // Очищаем URL от параметров
                            window.history.replaceState(
                                {},
                                document.title,
                                window.location.pathname,
                            );
                        })
                        .catch(() => {
                            setLoading(false);
                        });
                } else if (error) {
                    console.error("Auth error:", error);
                    setLoading(false);
                }

                window.removeEventListener("message", handleRedirect);
            };

            // Слушаем изменения URL (для редиректа)
            window.addEventListener("popstate", handleRedirect);

            // Также проверяем URL сразу после открытия окна
            const checkInterval = setInterval(() => {
                if (authWindow && authWindow.closed) {
                    clearInterval(checkInterval);
                    // Проверяем URL при закрытии попапа
                    const urlParams = new URLSearchParams(
                        window.location.search,
                    );
                    const code = urlParams.get("code");
                    if (!code) {
                        setLoading(false);
                    }
                }
            }, 500);
        } catch (error) {
            console.error("Login error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsAlreadySignIn(youtubeAccessToken ? true : false);
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
