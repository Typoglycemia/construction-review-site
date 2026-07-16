"use client";
// components/TurnstileWidget.tsx
// Cloudflare Turnstileのウィジェットを表示し、検証に成功したらトークンを
// window.__turnstileToken に保存する(投票・コメント・登録フォームが参照する)
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
    __turnstileToken?: string;
  }
}

export default function TurnstileWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    function renderWidget() {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          window.__turnstileToken = token;
        },
        "expired-callback": () => {
          window.__turnstileToken = undefined;
        },
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      // scriptがまだ読み込み中の場合、読み込み完了を待つ
      const interval = setInterval(() => {
        if (window.turnstile) {
          renderWidget();
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, []);

  return <div ref={containerRef} className="my-2" />;
}
