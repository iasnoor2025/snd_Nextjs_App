"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "./theme-toggle"
import { I18nErrorBoundary } from "./i18n-error-boundary"
import { useI18n } from "@/hooks/use-i18n"

export function SiteHeader() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isRTL } = useI18n();
  
  // Debug session state
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 HEADER - Session:', session);
    console.log('🔍 HEADER - Session user:', session?.user);
    console.log('🔍 HEADER - Session role:', session?.user?.role);
  }

  const handleForceLogout = async () => {
    await signOut({ redirect: false });
    // Clear any local storage or session storage
    localStorage.clear();
    sessionStorage.clear();
    // Force redirect to login
    router.push('/login');
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className={isRTL ? "-mr-1" : "-ml-1"} />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">SND Rental Management</h1>
        <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex items-center gap-2`}>
          <I18nErrorBoundary>
            <LanguageSwitcher />
          </I18nErrorBoundary>
          {status === "loading" ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : session ? (
            <div className="flex items-center gap-2">
              <Badge variant={
                session?.user?.role === "SUPER_ADMIN" ? "destructive" :
                session?.user?.role === "ADMIN" ? "default" :
                session?.user?.role === "MANAGER" ? "secondary" :
                session?.user?.role === "SUPERVISOR" ? "outline" :
                session?.user?.role === "OPERATOR" ? "secondary" :
                session?.user?.role === "EMPLOYEE" ? "default" :
                "secondary"
              }>
                {session?.user?.role || "USER"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {session?.user?.name || session?.user?.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "start" : "end"}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session?.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                    <LogOut className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    <span>Log out</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleForceLogout}>
                    <LogOut className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    <span>Force Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href="/login">Sign In</a>
              </Button>
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
