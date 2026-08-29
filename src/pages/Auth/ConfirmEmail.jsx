import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaEnvelope, FaExclamationTriangle } from "react-icons/fa";
import { apiErrorMessage, readApiResponse } from "@/lib/api-errors";

export default function ConfirmEmail() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ status: "loading", message: "Confirming your email address…" });

  useEffect(() => {
    const userId = params.get("userId");
    const code = params.get("code");
    if (!userId || !code) {
      setState({ status: "error", message: "This confirmation link is incomplete." });
      return;
    }

    const confirm = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/auth/confirm-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, code }),
        });
        const body = await readApiResponse(response, { fallbackMessage: "Email confirmation failed." });
        setState({ status: "success", message: body?.message || "Your email address has been confirmed." });
      } catch (error) {
        setState({ status: "error", message: apiErrorMessage(error, "The confirmation link is invalid or has expired.") });
      }
    };
    confirm();
  }, [params]);

  const Icon = state.status === "success" ? FaCheckCircle : state.status === "error" ? FaExclamationTriangle : FaEnvelope;
  return <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6"><div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"><Icon className={`mx-auto mb-5 text-5xl ${state.status === "success" ? "text-green-600" : state.status === "error" ? "text-red-600" : "animate-pulse text-indigo-600"}`} /><h1 className="text-2xl font-semibold text-gray-900">{state.status === "loading" ? "Confirming Email" : state.status === "success" ? "Email Confirmed" : "Confirmation Failed"}</h1><p className="mt-3 whitespace-pre-line text-sm text-gray-600">{state.message}</p>{state.status !== "loading" && <Link to="/login" className="mt-6 inline-flex rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700">Return to Login</Link>}</div></div>;
}
