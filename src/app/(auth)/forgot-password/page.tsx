import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/common/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/common/components/card";
import ForgotPasswordForm from "~/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Forgot your password? Enter your email below to reset it.",
};


export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-100 to-white">
      <div className="flex flex-col justify-center w-full px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto lg:w-96">
          <div className="text-center mb-11">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Forgot your password?</h2>
            <p className="mt-2 text-sm text-gray-600">
              No worries, we&apos;ll send you reset instructions.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
              <CardDescription className="text-center">Enter your email to receive a reset link</CardDescription>
            </CardHeader>
            <CardContent>
              <ForgotPasswordForm />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-center">
                <Link href="/login" >
                  <Button variant='link' className="p-0 h-fit">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      <div className="relative flex-1 hidden w-0 lg:block">
        <Image
          src="/placeholder.svg"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}