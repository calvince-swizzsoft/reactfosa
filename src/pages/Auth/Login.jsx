
import React, { useState } from "react";
import { FaGoogle, FaApple } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage, readApiResponse } from "@/lib/api";
import { useModuleTree } from "@/context/ModuleTreeContext";


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loadModules } = useModuleTree();
  const [loading, setLoading] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const [form, setForm] = useState({
    UserName: "",
    Password: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    UserName: "",
    CurrentPassword: "",
    NewPassword: "",
    ConfirmPassword: "",
  });

  const update = (field, value) => {
    setForm({ ...form, [field]: value });
  };



  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.UserName || !form.Password) {
      Swal.fire("Missing Fields", "Please enter email and password.", "warning");
      return;
    }

    setLoading(true);

    try {
    

       const response = await fetch(`${import.meta.env.VITE_APP_ADMIN_URL}/api/auth/login`,
  {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            UserName: form.UserName,
            Password: form.Password,
          }),
        }

       );

      const data = await readApiResponse(response, { fallbackMessage: "Login failed" });

      const userName = data.userName || data.UserName || form.UserName;
      if (data.requiresPasswordChange || data.RequiresPasswordChange) {
        setPasswordForm({
          UserName: userName,
          CurrentPassword: form.Password,
          NewPassword: "",
          ConfirmPassword: "",
        });
        setRequiresPasswordChange(true);
        return;
      }

      const roles = Array.isArray(data.roles) ? data.roles : Array.isArray(data.Roles) ? data.Roles : [];
      login(data.token || data.Token, userName, roles);
      await loadModules({ userName, roles }).catch(() => null);
      navigate("/home");
    } catch (error) {
      Swal.fire("Error", apiErrorMessage(error, "Login failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInitialPasswordChange = async (e) => {
    e.preventDefault();

    if (!passwordForm.CurrentPassword || !passwordForm.NewPassword || !passwordForm.ConfirmPassword) {
      Swal.fire("Missing Fields", "Complete all password fields.", "warning");
      return;
    }
    if (passwordForm.NewPassword !== passwordForm.ConfirmPassword) {
      Swal.fire("Passwords Do Not Match", "Confirm the same new password in both fields.", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_ADMIN_URL}/api/auth/change-initial-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(passwordForm),
        },
      );
      const data = await readApiResponse(response, { fallbackMessage: "Password change failed" });

      const roles = Array.isArray(data.roles) ? data.roles : Array.isArray(data.Roles) ? data.Roles : [];
      const userName = data.userName || data.UserName || passwordForm.UserName;
      login(data.token || data.Token, userName, roles);
      await loadModules({ userName, roles }).catch(() => null);
      navigate("/home");
    } catch (error) {
      Swal.fire("Unable to Change Password", apiErrorMessage(error, "Password change failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Section */}
      <div className="w-1/2 bg-[#3E1FB6] text-white flex flex-col justify-center items-end relative overflow-hidden">
        {/* Shimmer background animation */}
        {/* <div className="absolute inset-0 bg-gradient-to-br from-[#3E1FB6] via-[#5A3FE3] to-[#3E1FB6] animate-pulse opacity-40"></div> */}

        <div className="relative z-10 w-full">
          {/* Logo */}
          <div className="flex items-center mb-6 ml-50">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center">
              <span className="text-[#3E1FB6] font-bold text-lg">S</span>
            </div>
            <h2 className="ml-3 font-semibold text-xl">Swift Financial</h2>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-bold leading-snug mb-4 ml-50">
            Simplify your finance <br /> with Swift Financial
          </h1>
          <p className="text-gray-200 mb-6 ml-50">
            Manage accounts, journals, and payments — all in one place.
          </p>

          {/* Web App Skeleton */}
          <div className="rounded-l-xl overflow-hidden shadow-2xl border border-white bg-[#2B1B8C] backdrop-blur-sm max-[300px] ml-40">
            <div className="flex">
              {/* Sidebar */}
              <div className="w-14 bg-[#2B1B8C] p-3 flex flex-col space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-md ${i === 1
                      ? "bg-[#6B4EFF] animate-pulse"
                      : "bg-[#4B38C3] animate-pulse"
                      }`}
                  ></div>
                ))}
              </div>

              {/* Main Content */}
              <div className="flex flex-col w-full">

                <div className=" flex-1 bg-[#2B1B8C] shimmer justify-items-end">
                  <div className="bg-gray-200 rounded-md h-5 w-1/2 m-3 shimmer"></div>
                </div>

                <div className="flex rounded-tl-2xl bg-white/95">

                  <div className="flex-1 bg-indigo-800 rounded-tl-2xl h-full w-1/3 p-4">
                    <div className=" flex flex-col space-y-3">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-full h-6 rounded-md ${i === 1
                            ? "bg-[#6B4EFF] animate-pulse"
                            : "bg-[#4B38C3] animate-pulse"
                            }`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 w-2/3">
                    {/* Header Bar */}
                    <div className="bg-indigo-800 rounded-md h-8 w-full mb-4 shimmer flex justify-end items-center">
                      <div className="h-5 w-1/3 bg-gray-300 rounded-md shimmer mr-3"></div>
                    </div>



                    {/* Form Section */}
                    <div className="space-y-3 mb-3">
                      <div className="space-x-2 flex">
                        <div className="h-5 w-1/4 bg-gray-300 rounded shimmer"></div>
                        <div className="h-5 w-1/4 bg-gray-300 rounded shimmer"></div>
                        <div className="h-5 w-1/4 bg-gray-300 rounded shimmer"></div>
                        <div className="h-5 w-1/4 bg-gray-300 rounded shimmer"></div>
                      </div>
                      <div className="h-8 w-full bg-gray-300 rounded shimmer"></div>
                      <div className="h-5 w-1/2 bg-[#6B4EFF] rounded shimmer"></div>
                      <div className="h-8 w-full bg-gray-200 rounded shimmer"></div>
                    </div>

                    {/* Table-like Rows */}
                    <div className="space-y-2 animate-pulse bg-gray-200 p-2 rounded-md">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded"
                        >
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="h-4 bg-gray-300 rounded"></div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* Bottom Buttons */}
                    <div className="flex justify-end mt-5 space-x-2">
                      <div className="h-6 w-20 bg-gray-300 rounded shimmer"></div>
                      <div className="h-6 w-20 bg-[#6B4EFF] rounded shimmer"></div>
                    </div>
                  </div>



                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section (Sign up form) */}
      <div className="w-1/2 bg-white flex justify-center items-center">
        <div className="w-full max-w-md px-3">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            {requiresPasswordChange ? "Secure your account" : "Sign in to your account"}
          </h2>

          {requiresPasswordChange && (
            <p className="text-sm text-gray-600 mb-8">
              This is your first sign-in. Confirm the temporary password sent to your email, then choose a new password.
            </p>
          )}

          <form className="space-y-5" onSubmit={requiresPasswordChange ? handleInitialPasswordChange : handleLogin}>
            {requiresPasswordChange ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input type="text" value={passwordForm.UserName} disabled className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current temporary password</label>
                  <input type="password" value={passwordForm.CurrentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, CurrentPassword: e.target.value })} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                  <input type="password" value={passwordForm.NewPassword} onChange={(e) => setPasswordForm({ ...passwordForm, NewPassword: e.target.value })} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                  <input type="password" value={passwordForm.ConfirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, ConfirmPassword: e.target.value })} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]" />
                </div>
              </>
            ) : (
              <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email or Username
              </label>
              <input
                type="text"
                placeholder="Enter email or username"
                value={form.UserName}
                onChange={(e) => update("UserName", e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={form.Password}
                onChange={(e) => update("Password", e.target.value)}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]"
              />
            </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6B4EFF] hover:bg-[#5b3cd8] text-white py-2 rounded-md font-medium"
            >
              {loading ? "Signing you in..." : requiresPasswordChange ? "Change password and continue" : "Login"}
            </button>
          </form>

          {/* <p className="text-center text-gray-600 mt-6 text-sm">
            Already have an account?{" "}
            <a href="#" className="text-[#6B4EFF] font-medium hover:underline">
              Sign in
            </a>
          </p> */}
          
        </div>
      </div>
    </div>
  );
}

/* Add this shimmer animation to your global CSS (e.g. index.css or tailwind.css):
------------------------------------------------------ */
