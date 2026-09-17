

import { Suspense } from "react"
import Image from "next/image"
import { LoginForm } from "@/components/auth/login-form"
import { GridPattern } from "@/components/ui/grid-pattern"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Suspense fallback={<div>Loading...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden lg:flex items-center justify-center bg-muted overflow-hidden">
        {/* Background Image */}
        <Image
          src="/background.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={75}
        />
        {/* White Overlay for contrast - increased to 75% intensity */}
        <div className="absolute inset-0 bg-white/75" />
        {/* Background grid pattern - subtle overlay */}
        <GridPattern className="absolute inset-0 h-full w-full opacity-30" width={40} height={40} strokeDasharray="4 4" />
      </div>
    </div>
  )
}