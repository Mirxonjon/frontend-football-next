"use client";

import { useEffect, useRef } from "react";
import { message } from "antd";
import FT_API from "@/api/api";
import { tokens } from "@/api/tokens";
import { langFromUserModel } from "@/api/userLanguage";
import { langActions } from "@/store/slice/lang";
import { useDispatch } from "react-redux";

type GoogleAuthResponse = {
  status_code: number;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: number;
      phone: string | null;
      email: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      isVerified: boolean;
    };
  };
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

function loadGsiScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${GSI_SRC}"]`
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

type Props = {
  text?: "signin_with" | "signup_with" | "continue_with";
  width?: number;
};

const GoogleAuthButton = ({ text = "continue_with", width = 320 }: Props) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<any>();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set; Google sign-in disabled"
      );
      return;
    }

    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const res = await FT_API.post<GoogleAuthResponse>(
                "/auth/google",
                { idToken: response.credential }
              );
              const accessToken = res.data?.data?.accessToken;
              const refreshToken = res.data?.data?.refreshToken;
              if (accessToken) {
                tokens.save({ accessToken, refreshToken });
                if (res.data?.data?.user) {
                  localStorage.setItem(
                    "user",
                    JSON.stringify(res.data.data.user)
                  );
                  const serverLang = langFromUserModel(
                    (res.data.data.user as any)?.language
                  );
                  if (serverLang) dispatch(langActions.setLang(serverLang));
                }
                window.location.href = "/";
              } else {
                messageApi.open({
                  type: "error",
                  content: "Google auth: token kelmadi",
                });
              }
            } catch (err: any) {
              messageApi.open({
                type: "error",
                content:
                  err?.response?.data?.message ||
                  err?.message ||
                  "Google auth failed",
              });
            }
          },
          ux_mode: "popup",
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          logo_alignment: "center",
          width,
        });
      })
      .catch(() => {
        console.warn("Failed to load Google Identity Services script");
      });

    return () => {
      cancelled = true;
    };
  }, [text, width, messageApi]);

  return (
    <>
      {contextHolder}
      <div ref={buttonRef} style={{ display: "flex", justifyContent: "center" }} />
    </>
  );
};

export default GoogleAuthButton;
