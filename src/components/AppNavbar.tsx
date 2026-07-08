import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  Cloud,
  Globe,
  Globe2,
  LogOut,
  Menu,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import LogoutConfirmModal from "@/components/dashboard/LogoutConfirmModal";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  labelKey: string;
  emoji: string;
}

const PARENT_LINKS: NavItem[] = [
  { to: "/dashboard", labelKey: "navDashboard", emoji: "📊" },
  { to: "/add-child", labelKey: "navAddChild", emoji: "➕" },
  { to: "/history", labelKey: "navHistory", emoji: "📚" },
  { to: "/accounts", labelKey: "navAccounts", emoji: "👥" },
  { to: "/chat", labelKey: "navChat", emoji: "💬" },
  { to: "/profile", labelKey: "navProfile", emoji: "👤" },
];

const AppNavbar = () => {
  const { t, i18n } = useTranslation();
  const { username, logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLang = () => {
    const nextLanguage = i18n.language === "en" ? "ar" : "en";
    void i18n.changeLanguage(nextLanguage);
  };

  const displayName = username
    ? username.charAt(0).toUpperCase() + username.slice(1)
    : t("navParentDefaultName");
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success(t("navGoodbye"));
  };

  return (
    <>
      <header data-app-navbar="true" className="sticky top-0 z-40 animate-nav-slide-down">
        <div className="absolute inset-x-0 top-0 h-16 overflow-hidden pointer-events-none -z-10">
          <Cloud
            className="absolute -top-2 left-[12%] h-10 w-10 animate-float text-primary/20"
            style={{ animationDelay: "0s" }}
            strokeWidth={1.5}
          />
          <Star
            className="absolute top-3 left-[42%] h-5 w-5 animate-float text-accent/50"
            style={{ animationDelay: "1.2s" }}
            fill="currentColor"
          />
          <Globe2
            className="absolute top-1 right-[28%] h-6 w-6 animate-float text-secondary/30"
            style={{ animationDelay: "2s" }}
            strokeWidth={1.5}
          />
          <Cloud
            className="absolute top-4 right-[8%] h-8 w-8 animate-float text-secondary/25"
            style={{ animationDelay: "3s" }}
            strokeWidth={1.5}
          />
        </div>

        <div className="px-3 pt-3 sm:px-6">
          <div className="mx-auto max-w-7xl rounded-2xl border border-border/50 bg-card/70 shadow-card backdrop-blur-xl">
            <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-5">
              <Link to="/dashboard" className="group flex shrink-0 items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-button transition-transform group-hover:scale-110 group-hover:rotate-6">
                  <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <span className="hidden text-base font-bold text-foreground sm:inline">
                  Little Minds
                </span>
              </Link>

              <nav className="hidden items-center gap-1 md:flex">
                {PARENT_LINKS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-muted/60 hover:text-foreground"
                    activeClassName="!bg-primary/10 !text-primary scale-105 shadow-soft"
                  >
                    <span className="text-base leading-none">{item.emoji}</span>
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                ))}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground">
                      {t("navMore")}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/50 shadow-card">
                    <DropdownMenuItem asChild>
                      <Link to="/story-generator">✨ {t("navStoryGenerator")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-files">📁 {t("navMyFiles")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/children-stories">👧 {t("navChildrenStories")}</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>

              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle className="hidden sm:flex" />
                <button
                  type="button"
                  onClick={toggleLang}
                  className="hidden rounded-xl p-2 transition hover:bg-muted/60 sm:flex"
                  title={t("navChangeLanguage")}
                  aria-label={t("navChangeLanguage")}
                >
                  <Globe className="h-4 w-4" />
                </button>
                <span className="hidden text-sm text-muted-foreground lg:inline">
                  {t("welcomeBack")}{" "}
                  <span className="font-semibold text-foreground">{displayName}</span>
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="group flex items-center gap-1 rounded-full p-1 pr-1.5 transition-colors hover:bg-muted/60">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground shadow-soft">
                        {initial}
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/50 shadow-card">
                    <DropdownMenuLabel>
                      <div className="font-semibold">{displayName}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {t("navParentAccount")}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setLogoutOpen(true)}
                      className="cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("navLogout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted/60 md:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label={t("navOpenMenu")}
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-[80%] rounded-l-3xl border-l border-border/50 p-0 sm:w-[340px]"
        >
          <SheetHeader className="flex-row items-center justify-between space-y-0 px-5 pb-3 pt-5">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
              Little Minds
            </SheetTitle>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted/60"
              aria-label={t("navCloseMenu")}
            >
              <X className="h-5 w-5" />
            </button>
          </SheetHeader>

          <div className="mt-2 px-3">
            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {t("welcomeBack")} {displayName}
                </div>
                <div className="text-xs text-muted-foreground">{t("navParentAccount")}</div>
              </div>
            </div>
          </div>

          <nav className="mt-4 flex flex-col gap-1 px-3">
            {PARENT_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
                )}
                activeClassName="!bg-primary/10 !text-primary"
              >
                <span className="w-6 text-center text-lg leading-none">{item.emoji}</span>
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
            <Link
              to="/story-generator"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t("navStoryGenerator")}</span>
            </Link>
            <Link
              to="/my-files"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <BookOpen className="h-4 w-4" />
              <span>{t("navMyFiles")}</span>
            </Link>
            <Link
              to="/children-stories"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Users className="h-4 w-4" />
              <span>{t("navChildrenStories")}</span>
            </Link>
          </nav>

          <div className="absolute inset-x-0 bottom-0 space-y-3 border-t border-border/50 bg-background p-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-xs font-semibold text-foreground">{t("navTheme")}</span>
              </div>

              <button
                type="button"
                onClick={toggleLang}
                className="rounded-xl bg-muted p-2 transition hover:bg-muted/80"
                title={t("navChangeLanguage")}
                aria-label={t("navChangeLanguage")}
              >
                <Globe className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setLogoutOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15"
            >
              <LogOut className="h-4 w-4" />
              {t("navLogout")}
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
