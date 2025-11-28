import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

import { useAppDispatch } from "@/redux/hooks";
import { verifyOTP } from "@/features/auth/authThunks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const username = searchParams.get("username") || "";
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // ----------------------------
  // Auto-focus first input
  // ----------------------------
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  // ----------------------------
  // Handle OTP change + paste
  // ----------------------------
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "");

    if (!paste) return;

    const digits = paste.split("").slice(0, 4);

    const updated = [...otp];
    for (let i = 0; i < 4; i++) {
      updated[i] = digits[i] || "";
    }

    setOtp(updated);

    // Move focus to the correct next input
    const lastFilled = digits.length >= 4 ? 3 : digits.length - 1;
    refs.current[lastFilled]?.focus();
  };

  const handleOtpChange = (value: string, index: number) => {
    // If user pastes full OTP (ex: "1234")
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").split("");

      const updated = [...otp];
      for (let i = 0; i < 4; i++) {
        updated[i] = digits[i] || "";
      }
      setOtp(updated);

      // Focus last filled input
      const lastFilled = digits.length >= 4 ? 3 : digits.length;
      refs.current[lastFilled]?.focus();
      return;
    }

    // Normal: Only allow single digit
    if (!/^\d?$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    // Move focus to next box
    if (value && index < 3) refs.current[index + 1]?.focus();
  };

  // ----------------------------
  // Backspace Logic
  // ----------------------------
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      if (otp[index] === "") {
        if (index > 0) refs.current[index - 1]?.focus();
      } else {
        const updated = [...otp];
        updated[index] = "";
        setOtp(updated);
      }
    }
  };

  // ----------------------------
  // Submit OTP
  // ----------------------------
  const handleVerify = async () => {
    const code = otp.join("");

    const payload = { username, email, otp: code };

    try {
      await dispatch(verifyOTP(payload)).unwrap();
      navigate("/app/chats", { replace: true });
    } catch (err) {
      console.log("OTP verification failed:", err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen">
      {/* LEFT SIDE */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6 sm:p-10 md:p-12 lg:p-16">
        <div className="w-full max-w-md">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Verify OTP</h1>

          <p className="text-sm text-gray-600 mb-6">
            OTP sent to <strong>{email}</strong>
          </p>

          {/* OTP Inputs */}
          <div className="flex gap-10 justify-start mb-6">
            {otp.map((digit, i) => (
              <Input
                key={i}
                value={digit}
                maxLength={1}
                inputMode="numeric"
                className="w-12 h-14 text-center text-xl"
                onPaste={handlePaste}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                ref={(el) => (refs.current[i] = el)}
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            disabled={otp.some((d) => d === "")}
            className="w-full text-black h-12 bg-zinc-100 hover:cursor-pointer"
          >
            Confirm OTP
          </Button>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hidden md:block md:w-1/2 bg-custom-bg-1"></div>
    </div>
  );
}
