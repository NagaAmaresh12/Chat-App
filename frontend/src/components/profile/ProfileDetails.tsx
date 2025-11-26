import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Pencil, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { editProfile } from "@/features/user/userThunks.ts";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form.tsx";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadFileThunk } from "@/features/message/messageThunks"; // 👈 new thunk

const profileSchema = z.object({
  username: z.string().min(1, "Name is required").max(50, "Name too long"),
  bio: z.string().max(200, "Bio too long").optional(),
  email: z
    .string()
    .email("Invalid email")
    .refine((val) => val.endsWith("@gmail.com"), {
      message: "Only Gmail addresses are allowed",
    }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileDetails = () => {
  const { id, username, email, bio, isOnline, avatar } = useAppSelector(
    (state: any) => state.auth
  );
  const user = { id, username, email, bio, isOnline, avatar };
  console.log("from profileDetails:", { user });
  const [newInputData, setnewInputData] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    email: user?.email || "",
  });

  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: newInputData?.username || "",
      bio: newInputData?.bio || "",
      email: newInputData?.email || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    console.log("====================================");
    console.log("Form Submitted");
    console.log("====================================");
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setIsUploading(true);
      const file = fileInputRef.current?.files?.[0];

      const payload: any = {
        userId: user.id,
        ...data,
      };

      if (file) {
        // 👇 upload file via thunk
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "avatar");

        const res = await dispatch(uploadFileThunk(formData)).unwrap();
        if (res?.url) payload.avatar = res.url;
      }

      await dispatch(editProfile(payload)).unwrap();
      toast.success("Profile updated successfully");

      if (fileInputRef.current) fileInputRef.current.value = "";
      setPreviewUrl(null);
    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast.error(error?.message || "Failed to update profile");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  };

  return (
    <section className="w-1/4 bg-amber-50 p-6 space-y-10">
      {/* Avatar + Status */}
      <div className="flex flex-col items-center gap-4 relative">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-lg my-4 font-semibold">Profile</h2>{" "}
          <span>{""}</span>
        </div>
        <div className="relative group">
          <Avatar className="w-32 h-32 transition-all duration-200 group-hover:brightness-50 group-hover:cursor-pointer ">
            <AvatarImage
              src={previewUrl || user?.avatar || "/default-avatar.png"}
              className="object-cover"
            />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-md transition-opacity duration-200 ${
              isUploading
                ? "cursor-not-allowed opacity-100"
                : "cursor-pointer opacity-0 group-hover:opacity-100"
            }`}
            onClick={handleAvatarClick}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 text-gray-700 animate-spin" />
            ) : (
              <Pencil className="w-4 h-4 text-gray-700" />
            )}
          </div>
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={isUploading}
          />
        </div>
        <Badge variant="secondary">{user ? "Active" : "Inactive"}</Badge>
      </div>

      {/* Profile Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your name"
                    {...field}
                    disabled={isUploading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Tell us about yourself"
                    {...field}
                    disabled={isUploading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your.email@gmail.com"
                    {...field}
                    disabled={isUploading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="outline"
            className="mt-4 w-full"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </Form>

      {/* Separator */}
      <div className="flex items-center gap-2 mt-30">
        <Separator className="flex-1" />
        <h1 className="font-semibold text-sm! text-zinc-500">Mucchatlu</h1>
        <Separator className="flex-1" />
      </div>
    </section>
  );
};

export default ProfileDetails;
