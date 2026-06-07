"use client";

import { useAuthStore } from "@/store/authStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/authApi";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { getInitials } from "@/lib/utils";
import { Lock } from "lucide-react";

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "Min 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type PwForm = z.infer<typeof pwSchema>;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [changingPw, setChangingPw] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  const onPwSubmit = async (data: PwForm) => {
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      reset();
      setChangingPw(false);
    } catch {
      toast.error("Failed to change password");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-up max-w-xl">
      <h1 className="text-xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
            {getInitials(user.name)}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">{user.name}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium capitalize">
              {user.role}
            </span>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          {([
            ["Full name", user.name],
            ["Email", user.email],
            user.phone ? ["Phone", user.phone] : null,
            ["Verified", user.is_verified ? "Yes" : "Not yet"],
          ] as Array<[string, string] | null>)
            .filter((x): x is [string, string] => x !== null)
            .map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between py-2.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-gray-500">{label}</span>
                <span
                  className={
                    label === "Verified" && value === "Yes"
                      ? "text-green-600 font-medium"
                      : "font-medium text-gray-800"
                  }
                >
                  {value}
                </span>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Change password</h2>
          </div>
          {!changingPw && (
            <Button variant="outline" size="sm" onClick={() => setChangingPw(true)}>
              Change
            </Button>
          )}
        </div>
        {changingPw && (
          <form onSubmit={handleSubmit(onPwSubmit)} className="space-y-3">
            <Input
              label="Current password"
              type="password"
              error={errors.currentPassword?.message}
              {...register("currentPassword")}
            />
            <Input
              label="New password"
              type="password"
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <Input
              label="Confirm new password"
              type="password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" loading={isSubmitting}>
                Save password
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setChangingPw(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
