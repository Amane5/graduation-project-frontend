import { Link } from "react-router-dom";
import { Sparkles, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import LogoutConfirmModal from "./LogoutConfirmModal";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardNavbarProps {
  parentName?: string;
}

const DashboardNavbar = ({ parentName }: DashboardNavbarProps) => {
  const { username, logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const displayName =
    parentName ?? (username ? username.charAt(0).toUpperCase() + username.slice(1) : "Parent");

  const handleLogout = () => {
    logout();
    toast.success("See you soon! 👋");
  };

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left — Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-button transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base text-foreground hidden sm:inline">
              Little Minds
            </span>
          </Link>

          {/* Center — Page title */}
          <h1 className="hidden md:block text-lg font-bold text-foreground">Dashboard</h1>

          {/* Right — Welcome + avatar */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">
              Hi <span className="font-semibold text-foreground">{displayName}</span> 👋
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full p-1 pr-2 hover:bg-muted/60 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-soft">
                    {initial}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-card border-border/50">
                <DropdownMenuLabel>
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-xs text-muted-foreground font-normal">Parent account</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLogoutOpen(true)}
                  className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <LogoutConfirmModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default DashboardNavbar;
