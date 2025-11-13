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

// ✅ Validation Schemas

type SendOTPData = z.infer<typeof sendOTPSchema>;
type ConfirmOTPData = z.infer<typeof confirmOTPSchema>;

export default function LoginPage() {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(4).fill(""));
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  console.log({ user });

  const navigate = useNavigate();
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
  const dispatch = useAppDispatch();
  // ✅ Send OTP Handler
  const handleSendOTP = async (values: SendOTPData) => {
    setLoading(true);
    try {
      const res = await dispatch(sendOTP(values));
      console.log("✅ OTP Sent:", res);
      setOtpSent(true);
    } catch (err: any) {
      console.error("❌ OTP Send Failed:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };
  // ✅ Verify OTP Handler
  const handleVerifyOTP = async () => {
    setVerifying(true);
    try {
      const otpCode = otp.join("");
      const { username, email } = formEmail.getValues();

      const res = await dispatch(
        verifyOTP({
          username,
          email,
          otp: otpCode,
        })
      ).unwrap();

      console.log("✅ OTP Verified:", res);
      // ✅ Redirect to welcome page after successful verification
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error(
        "❌ OTP Verification Failed:",
        err.response?.data || err.message
      );
    } finally {
      setVerifying(false);
    }
  };

  // ✅ OTP Change Logic
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    // ✅ If user pastes full OTP (like 1234)
    if (value.length > 1) {
      const digits = value.slice(0, 4).split("");
      setOtp(digits);
      // Move focus to the last field
      otpRefs.current[3]?.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);

    // ✅ Move to next field automatically
    if (value && index < 3) otpRefs.current[index + 1]?.focus();
  };

  // ✅ Handle keydown (for Backspace navigation)
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
        // Just clear current field
        const updated = [...otp];
        updated[index] = "";
        setOtp(updated);
      }
    }
  };

  // ✅ Focus first field automatically when OTP fields appear
  useEffect(() => {
    if (otpSent) {
      const timer = setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [otpSent]);
  const allDigitsFilled = otp.every((v) => v !== "");

  return !user ? (
    <div className="flex flex-col md:flex-row min-h-screen w-screen bg-amber-100">
      {/* Left Section */}
      <div className="flex flex-1 flex-col justify-center px-6 md:px-16 bg-white shadow-lg">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">
            Login
          </h1>

          {/* Email + Username Form */}
          <Form {...formEmail}>
            <form
              onSubmit={formEmail.handleSubmit(handleSendOTP)}
              className="space-y-5"
            >
              <FormField
                control={formEmail.control}
                name="username"
                render={({ field }) => (
                  <FormItem className={otpSent ? "hidden" : ""}>
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
                  <FormItem className={otpSent ? "hidden" : ""}>
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

              {!otpSent && (
                <Button
                  type="submit"
                  className="w-full h-12 text-black!"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Send OTP
                </Button>
              )}
            </form>
          </Form>

          {/* OTP Form */}
          {otpSent && (
            <Form {...formOTP}>
              <div className="mt-6 space-y-4">
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
                      className="w-1/4 h-12 text-center text-lg"
                    />
                  ))}
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={!allDigitsFilled || verifying}
                  className="w-full h-12 mt-4 text-black bg-gray-200"
                >
                  {verifying && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  Confirm OTP
                </Button>
              </div>
            </Form>
          )}

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
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center">
        <h2 className="text-white text-4xl font-semibold">Welcome Back 👋</h2>
      </div>
    </div>
  ) : (
    <Navigate to="/" />
  );
}
