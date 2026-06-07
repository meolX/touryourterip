"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/authApi";
import { useAuthStore } from "@/store/authStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["guest", "host"]),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "guest" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register(data);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      toast.success(`Account created! Welcome, ${user.name.split(" ")[0]}!`);
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Registration failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
      <p className="text-gray-500 text-sm mb-8">Start exploring in seconds</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Rahul Sharma"
          leftIcon={<User size={16} />}
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Phone (optional)"
          type="tel"
          placeholder="+91 98765 43210"
          leftIcon={<Phone size={16} />}
          error={errors.phone?.message}
          {...register("phone")}
        />

        <Input
          label="Password"
          type={showPass ? "text" : "password"}
          placeholder="Min. 8 characters"
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="hover:text-gray-600"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Role toggle */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            I want to
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["guest", "host"] as const).map((role) => (
              <label
                key={role}
                className="relative flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 px-3 cursor-pointer text-sm font-medium text-gray-700 hover:border-brand-400 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700"
              >
                <input
                  type="radio"
                  value={role}
                  className="sr-only"
                  {...register("role")}
                />
                {role === "guest" ? "🏡 Travel & book" : "🏨 List property"}
              </label>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
        >
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
