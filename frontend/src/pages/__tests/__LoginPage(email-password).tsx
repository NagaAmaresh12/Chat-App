import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, Chrome } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import axiosInstance from "@/lib/axios";

// ✅ Zod validation schema
const loginSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address")
    .refine(
      (email) => email.endsWith("@gmail.com"),
      "Only Gmail addresses are allowed"
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    try {
      const response = await axiosInstance.post("/users/auth/login", values);

      // Save tokens from backend
      const { accessToken, refreshToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      console.log("✅ Login successful", response.data);
      // You can navigate or dispatch Redux actions here
    } catch (error: any) {
      console.error("❌ Login failed:", error.response?.data || error.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-screen bg-amber-100">
      {/* ✅ Left Section - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 md:px-16 bg-white shadow-lg">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">
            Login
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          placeholder="Enter your email"
                          className="pl-10 h-12"
                          type="email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          placeholder="Enter your password"
                          className="pl-10 pr-10 h-12"
                          type={showPassword ? "text" : "password"}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1 right-3  h-10"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12" variant={"ghost"}>
                Login
              </Button>
            </form>
          </Form>

          {/* Separator */}
          <div className="flex items-center my-6">
            <Separator className="flex-1" />
            <span className="px-3 text-gray-500 text-sm">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Google Button */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-12"
            type="button"
            onClick={() => alert("Google login clicked")}
          >
            <Chrome className="h-5 w-5" />
            Continue with Google
          </Button>
        </div>
      </div>

      {/* ✅ Right Section - Optional (illustration / gradient background) */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center">
        <h2 className="text-white text-4xl font-semibold">Welcome Back 👋</h2>
      </div>
    </div>
  );
}

export default LoginPage;
