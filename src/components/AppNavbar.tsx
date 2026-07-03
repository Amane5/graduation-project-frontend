import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Sparkles,
  LogOut,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  UserPlus,
  BookOpen,
  Users,
  MessageCircle,
  Cloud,
  Star,
  Globe2,
  FolderOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import LogoutConfirmModal from "@/components/dashboard/LogoutConfirmModal";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { BookPlus } from "lucide-react";
import { Globe } from "lucide-react";
// import { Link } from "react-router-dom";
interface NavItem {
  to: string;
  label: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PARENT_LINKS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", emoji: "📊", icon: LayoutDashboard },
  { to: "/add-child", label: "Add Child", emoji: "➕", icon: UserPlus },
  { to: "/history", label: "History", emoji: "📚", icon: BookOpen },
  { to: "/accounts", label: "Accounts", emoji: "👥", icon: Users },
  { to: "/chat", label: "Chat", emoji: "💬", icon: MessageCircle },
  { to: "/profile", label: "Profile", emoji: "👤", icon: User },
  // {
  //   to: "/my-files",
  //   label: "My Files",
  //   emoji: "📁",
  //   icon: FolderOpen,
  // },
  // {
  //   to: "/children-stories",
  //   label: "Children Stories",
  //   emoji: "👧",
  //   icon: BookOpen,
  // },
];

const CHILD_LINKS: NavItem[] = [
  { to: "/chat", label: "Chat", emoji: "💬", icon: MessageCircle },
  { to: "/my-stories", label: "My Stories", emoji: "📖", icon: BookOpen },
];

const AppNavbar = () => {
  const { username, userType, logout } = useAuth();
  const { i18n } = useTranslation();
  // const toggleLang = () => {
  //   const newLang = i18n.language === "ar" ? "en" : "ar";
  //   i18n.changeLanguage(newLang);
  //   localStorage.setItem("lang", newLang);
  // };
  const toggleLang = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };
  const isParent = userType === "parent";
  const isChild = userType === "child";
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMore, setOpenMore] = useState(false);
  const links =
    userType === "parent"
      ? PARENT_LINKS
      : userType === "child"
        ? CHILD_LINKS
        : [];
  const home = userType === "parent" ? "/dashboard" : "/chat";

  const displayName = username
    ? username.charAt(0).toUpperCase() + username.slice(1)
    : userType === "child"
      ? "Friend"
      : "Parent";
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = userType === "parent" ? "Parent account" : "Kid explorer";

  const handleLogout = () => {
    logout();
    toast.success("See you soon! 👋");
  };

  return (
    <>
      <header className="sticky top-0 z-40 animate-nav-slide-down">
        <div className="absolute inset-x-0 top-0 h-16 overflow-hidden pointer-events-none -z-10">
          <Cloud
            className="absolute -top-2 left-[12%] w-10 h-10 text-primary/20 animate-float"
            style={{ animationDelay: "0s" }}
            strokeWidth={1.5}
          />
          <Star
            className="absolute top-3 left-[42%] w-5 h-5 text-accent/50 animate-float"
            style={{ animationDelay: "1.2s" }}
            fill="currentColor"
          />
          <Globe2
            className="absolute top-1 right-[28%] w-6 h-6 text-secondary/30 animate-float"
            style={{ animationDelay: "2s" }}
            strokeWidth={1.5}
          />
          <Cloud
            className="absolute top-4 right-[8%] w-8 h-8 text-secondary/25 animate-float"
            style={{ animationDelay: "3s" }}
            strokeWidth={1.5}
          />
        </div>

        <div className="px-3 sm:px-6 pt-3">
          <div className="max-w-7xl mx-auto bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl shadow-card">
            <div className="h-14 px-3 sm:px-5 flex items-center justify-between gap-3">
              <Link
                to={home}
                className="flex items-center gap-2 group shrink-0"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-button transition-transform group-hover:scale-110 group-hover:rotate-6">
                  <Sparkles
                    className="w-5 h-5 text-primary-foreground"
                    strokeWidth={2.5}
                  />
                </div>
                <span className="font-bold text-base text-foreground hidden sm:inline">
                  Little Minds
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {links.map((item) => (
                  <NavLink
                    key={item.to + item.label}
                    to={item.to}
                    end
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:scale-105 transition-all duration-200"
                    activeClassName="!text-primary !bg-primary/10 shadow-soft scale-105"
                  >
                    <span className="text-base leading-none">{item.emoji}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                <div className="relative ml-1">
                  <button
                    onClick={() => setOpenMore(!openMore)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
                  >
                    More
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {openMore && (
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden z-50">
                      {/* Story Generator */}
                      <Link
                        to="/story-generator"
                        onClick={() => setOpenMore(false)}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-muted/60 transition"
                      >
                        ✨ Story Generator
                      </Link>

                      {/* My Files */}
                      <Link
                        to="/my-files"
                        onClick={() => setOpenMore(false)}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-muted/60 transition"
                      >
                        📁 My Files
                      </Link>
                      {/* Children's Stories */}
                      <Link
                        to="/children-stories"
                        onClick={() => setOpenMore(false)}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-muted/60 transition"
                      >
                        👧 Children's Stories
                      </Link>
                    </div>
                  )}
                </div>
              </nav>

              <div className="flex items-center gap-2 shrink-0">
                <ThemeToggle className="hidden sm:flex" />
                <button
                  onClick={toggleLang}
                  className="hidden sm:flex p-2 rounded-xl hover:bg-muted/60 transition"
                  title="Change Language"
                >
                  <Globe className="w-4 h-4" />
                </button>
                <span className="hidden lg:inline text-sm text-muted-foreground">
                  Hi{" "}
                  <span className="font-semibold text-foreground">
                    {displayName}
                  </span>{" "}
                  👋
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 rounded-full p-1 pr-1.5 hover:bg-muted/60 transition-colors group">
                      <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-soft">
                        {initial}
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-2xl shadow-card border-border/50"
                  >
                    <DropdownMenuLabel>
                      <div className="font-semibold">{displayName}</div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {roleLabel}
                      </div>
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

                <button
                  type="button"
                  className="md:hidden ml-1 w-10 h-10 rounded-xl flex items-center justify-center text-foreground hover:bg-muted/60 transition-colors"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-[80%] sm:w-[340px] rounded-l-3xl border-l border-border/50 p-0"
        >
          <SheetHeader className="px-5 pt-5 pb-3 flex-row items-center justify-between space-y-0">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Sparkles
                  className="w-4 h-4 text-primary-foreground"
                  strokeWidth={2.5}
                />
              </div>
              Little Minds
            </SheetTitle>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>

          <div className="px-3 mt-2">
            <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-muted/40">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">
                  Hi {displayName} 👋
                </div>
                <div className="text-xs text-muted-foreground">{roleLabel}</div>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-3 mt-4">
            {links.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
                )}
                activeClassName="!text-primary !bg-primary/10"
              >
                <span className="text-lg leading-none w-6 text-center">
                  {item.emoji}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* <div className="absolute bottom-0 inset-x-0 p-4 border-t border-border/50 space-y-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40">
              <span className="text-sm font-semibold text-foreground">
                Theme
              </span>
              <ThemeToggle />
              <button
                onClick={() => changeLang("ar")}
                className="px-2 py-1 text-xs rounded-lg bg-muted hover:bg-muted/80"
              >
                AR
              </button>

              <button
                onClick={() => changeLang("en")}
                className="px-2 py-1 text-xs rounded-lg bg-muted hover:bg-muted/80"
              >
                EN
              </button>
            </div>
            <button
              onClick={() => {
                setMobileOpen(false);
                setLogoutOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div> */}
          <div className="absolute bottom-0 inset-x-0 p-4 border-t border-border/50 space-y-3 bg-background">
            {/* CONTROLS ROW */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40">
              {/* THEME */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-xs font-semibold text-foreground">
                  Theme
                </span>
              </div>

              {/* LANGUAGE */}
              <button
                onClick={toggleLang}
                className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition"
                title="Change Language"
              >
                <Globe className="w-4 h-4" />
              </button>
            </div>

            {/* LOGOUT */}
            <button
              onClick={() => {
                setMobileOpen(false);
                setLogoutOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <LogoutConfirmModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default AppNavbar;
// <div className="absolute bottom-0 inset-x-0 p-4 border-t border-border/50 space-y-2">
//   {/* THEME */}
//   <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40">
//     <span className="text-sm font-semibold text-foreground">
//       Theme
//     </span>
//     <ThemeToggle />
//   </div>

//   {/* LANGUAGE */}
//   <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40">
//     <span className="text-sm font-semibold text-foreground">
//       Language
//     </span>

//     <div className="flex gap-2">
//       <button
//         onClick={() => changeLang("ar")}
//         className="px-2 py-1 text-xs rounded-lg bg-muted hover:bg-muted/80"
//       >
//         AR
//       </button>

//       <button
//         onClick={() => changeLang("en")}
//         className="px-2 py-1 text-xs rounded-lg bg-muted hover:bg-muted/80"
//       >
//         EN
//       </button>
//     </div>
//   </div>

//   {/* LOGOUT */}
//   <button
//     onClick={() => {
//       setMobileOpen(false);
//       setLogoutOpen(true);
//     }}
//     className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors"
//   >
//     <LogOut className="w-4 h-4" />
//     Logout
//   </button>
// </div>
