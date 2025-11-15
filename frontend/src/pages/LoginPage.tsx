// ============================================================
// COMPLETE FIX - LoginPage.tsx
// ============================================================

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User, Chrome, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { confirmOTPSchema, sendOTPSchema } from "@/lib/validation/authSchema";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { sendOTP, verifyOTP } from "@/features/auth/authThunks";
import { Navigate, useNavigate } from "react-router-dom";
import { resetOtpState } from "@/features/auth/authSlice.ts";

type SendOTPData = z.infer<typeof sendOTPSchema>;
type ConfirmOTPData = z.infer<typeof confirmOTPSchema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, otpSent, status } = useAppSelector((state) => state.auth);

  // ✅ CRITICAL: Use useRef to persist credentials across re-renders
  const userCredentialsRef = useRef<{
    username: string;
    email: string;
  }>({ username: "", email: "" });

  const [otp, setOtp] = useState<string[]>(Array(4).fill(""));
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ✅ Forms setup
  const formEmail = useForm<SendOTPData>({
    resolver: zodResolver(sendOTPSchema),
    defaultValues: { username: "", email: "" },
  });

  const formOTP = useForm<ConfirmOTPData>({
    resolver: zodResolver(confirmOTPSchema),
    defaultValues: { OTP: "" },
  });

  // ✅ Send OTP Handler - ULTIMATE FIX
  const handleSendOTP = async (values: SendOTPData) => {
    console.log("🔵 handleSendOTP called with:", values);

    // ✅ CRITICAL FIX: Store in ref IMMEDIATELY and SYNCHRONOUSLY
    userCredentialsRef.current = {
      username: values.username,
      email: values.email,
    };

    console.log("✅ Stored credentials in ref:", userCredentialsRef.current);

    setLoading(true);
    try {
      console.log("📤 Dispatching sendOTP with:", values);

      await dispatch(sendOTP(values)).unwrap();

      console.log("✅ OTP sent successfully");
      console.log("📋 Credentials still in ref:", userCredentialsRef.current);

      // otpSent state will be updated by the reducer
    } catch (error: any) {
      console.error("❌ Send OTP failed:", error);
      // Don't reset credentials on error - user might retry
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify OTP Handler - USES REF
  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

    console.log("🔵 handleVerifyOTP called");
    console.log("📋 User Credentials from REF:", userCredentialsRef.current);
    console.log("🔢 OTP Code:", otpCode);

    // ✅ Check credentials from ref
    if (
      !userCredentialsRef.current.username ||
      !userCredentialsRef.current.email
    ) {
      console.error("❌ Missing credentials:", userCredentialsRef.current);
      alert("Session expired. Please restart login process.");
      dispatch(resetOtpState());
      return;
    }

    if (otpCode.length !== 4) {
      console.error("❌ Invalid OTP length:", otpCode.length);
      return;
    }

    setVerifying(true);
    try {
      const payload = {
        username: userCredentialsRef.current.username,
        email: userCredentialsRef.current.email,
        otp: otpCode,
      };

      console.log("📤 Dispatching verifyOTP with:", payload);

      const result = await dispatch(verifyOTP(payload)).unwrap();

      console.log("✅ OTP Verified successfully:", result);

      // Navigate after successful verification
      navigate("/home", { replace: true });
    } catch (error: any) {
      console.error("❌ OTP Verification Failed:", error);
      // Clear OTP on error
      setOtp(Array(4).fill(""));
      otpRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  // ✅ OTP Change Logic
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    // Handle paste (full OTP like "1234")
    if (value.length > 1) {
      const digits = value.slice(0, 4).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);

      // Focus the last filled field or the 4th field
      const lastIndex = Math.min(index + digits.length - 1, 3);
      otpRefs.current[lastIndex]?.focus();
      return;
    }

    // Single digit entry
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);

    // Move to next field
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // ✅ Handle keydown (Backspace navigation)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        // Move to previous field and clear it
        const updated = [...otp];
        updated[index - 1] = "";
        setOtp(updated);
        otpRefs.current[index - 1]?.focus();
      } else {
        // Clear current field
        const updated = [...otp];
        updated[index] = "";
        setOtp(updated);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // ✅ Focus first OTP field when OTP screen appears
  useEffect(() => {
    if (otpSent) {
      console.log(
        "🎯 OTP screen appeared, credentials in ref:",
        userCredentialsRef.current
      );
      const timer = setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [otpSent]);

  // ✅ Reset everything when going back
  const handleBackToEmail = () => {
    dispatch(resetOtpState());
    setOtp(Array(4).fill(""));
    userCredentialsRef.current = { username: "", email: "" };
    formEmail.reset();
  };

  const allDigitsFilled = otp.every((v) => v !== "");

  // ✅ Redirect if already logged in
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-screen bg-amber-100">
      {/* Left Section */}
      <div className="flex flex-1 flex-col justify-center px-6 md:px-16 bg-white shadow-lg">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">
            {otpSent ? "Verify OTP" : "Login"}
          </h1>

          {/* Email + Username Form - Conditionally Render */}
          {!otpSent && (
            <Form {...formEmail}>
              <form
                onSubmit={formEmail.handleSubmit(handleSendOTP)}
                className="space-y-5"
              >
                <FormField
                  control={formEmail.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            placeholder="Enter your username"
                            className="pl-10 h-12"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formEmail.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            placeholder="Enter your Gmail"
                            type="email"
                            className="pl-10 h-12"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={loading || status === "loading"}
                >
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Send OTP
                </Button>
              </form>
            </Form>
          )}

          {/* OTP Form - Conditionally Render */}
          {otpSent && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Enter the 4-digit code sent to{" "}
                <span className="font-semibold">
                  {userCredentialsRef.current.email || "your email"}
                </span>
              </div>

              <Form {...formOTP}>
                <div className="space-y-4">
                  <FormLabel>Enter OTP</FormLabel>
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, i) => (
                      <Input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData("text");
                          handleOtpChange(pasted, i);
                        }}
                        className="w-1/4 h-12 text-center text-lg font-semibold"
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleVerifyOTP}
                    disabled={
                      !allDigitsFilled || verifying || status === "loading"
                    }
                    className="w-full h-12 mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {verifying && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    Confirm OTP
                  </Button>

                  <Button
                    onClick={handleBackToEmail}
                    variant="ghost"
                    className="w-full h-10 text-gray-600"
                    type="button"
                  >
                    ← Back to Email
                  </Button>
                </div>
              </Form>
            </div>
          )}

          {/* Google Login - Only show when OTP not sent */}
          {!otpSent && (
            <>
              <div className="flex items-center my-6">
                <Separator className="flex-1" />
                <span className="px-3 text-gray-500 text-sm">or</span>
                <Separator className="flex-1" />
              </div>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 h-12"
                type="button"
                onClick={() => alert("Google login clicked")}
              >
                <Chrome className="h-5 w-5" />
                Continue with Google
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-white text-4xl font-semibold mb-4">
            Welcome Back 👋
          </h2>
          <p className="text-white/90 text-lg">
            {otpSent
              ? "Check your email for the OTP code"
              : "Sign in to continue to your account"}
          </p>
        </div>
      </div>
    </div>
  );
}
