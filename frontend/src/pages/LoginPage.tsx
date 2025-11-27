// LoginPage.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendOTPSchema } from "@/lib/validation/authSchema";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { sendOTP } from "@/features/auth/authThunks";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { FcGoogle } from "react-icons/fc";

type SendOTPData = z.infer<typeof sendOTPSchema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { status, id } = useAppSelector((state) => state.auth);

  const form = useForm<SendOTPData>({
    resolver: zodResolver(sendOTPSchema),
    defaultValues: { username: "", email: "" },
  });

  const handleSendOTP = async (values: SendOTPData) => {
    try {
      await dispatch(sendOTP(values)).unwrap();
      navigate(`/verify?username=${values.username}&email=${values.email}`, {
        replace: true,
      });
    } catch (err) {
      console.log("OTP sending failed:", err);
    }
  };

  return id ? (
    <Navigate to={"/app/chats"} />
  ) : (
    <div className="flex flex-col md:flex-row h-screen w-screen">
      {/* LEFT SIDE */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6 sm:p-10 md:p-12 lg:p-16">
        <div className="w-full max-w-md">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8">Login</h1>

          <form
            onSubmit={form.handleSubmit(handleSendOTP)}
            className="space-y-6"
          >
            {/* USERNAME */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                {...form.register("username")}
                placeholder="Enter username"
                className="h-12"
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                {...form.register("email")}
                placeholder="Enter email"
                className="h-12"
              />
            </div>

            {/* SUBMIT */}
            <Button
              disabled={status === "loading"}
              type="submit"
              className="w-full text-black! bg-zinc-100! h-12"
            >
              Send OTP
            </Button>

            {/* OR SEPARATOR */}
            <div className="flex items-center space-x-4">
              <Separator className="flex-1" />
              <span className="text-sm text-gray-500">or</span>
              <Separator className="flex-1" />
            </div>

            {/* GOOGLE SIGN-IN */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center bg-zinc-100! gap-3 h-12"
            >
              <FcGoogle size={22} />
              Continue with Google
            </Button>
          </form>
        </div>
      </div>
      {/* RIGHT SIDE: Hidden on small screens */}
      {/* yellow bg-[#ffa812] */}
      <div className="hidden md:block md:w-1/2 bg-[#3A6EA5]"></div>
    </div>
  );
}
