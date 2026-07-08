import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BookOpen, Globe, LogOut, Menu, MessageCircle, Sparkles, Trophy, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutConfirmModal from "@/components/dashboard/LogoutConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CHILD_LINKS = [
  { to: "/chat", labelKey: "navChat", icon: MessageCircle },
  { to: "/my-stories", labelKey: "navMyStories", icon: BookOpen },
  { to: "/my-challenges", labelKey: "navMyChallenges", icon: Trophy },
] as const;

const ChildNavbar = () => {
  const { t, i18n } = useTranslation();
  const { logout, username } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const displayName = username
    ? username.charAt(0).toUpperCase() + username.slice(1)
    : t("navChildDefaultName");

  const toggleLang = () => {
    const nextLanguage = i18n.language === "en" ? "ar" : "en";
    void i18n.changeLanguage(nextLanguage);
  };

  const handleLogout = () => {
    logout();
    toast.success(t("navGoodbye"));
  };

  return (
    <>
      <header
        data-app-navbar="true"
        className="sticky top-0 z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/chat" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-soft">
              <Sparkles className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-foreground">
                {displayName}
              </div>
              <div className="text-xs text-muted-foreground">{t("navKidExplorer")}</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {CHILD_LINKS.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to !== "/chat"}
                  className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  activeClassName="!bg-secondary !text-secondary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <button
              type="button"
              onClick={toggleLang}
              className="rounded-xl p-2 transition hover:bg-muted/60"
              title={t("navChangeLanguage")}
              aria-label={t("navChangeLanguage")}
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/15"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("navLogout")}</span>
            </button>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-muted/60 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t("navOpenMenu")}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-[84%] max-w-sm border-l border-border/50 p-0">
          <SheetHeader className="flex-row items-center justify-between px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-left">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>{displayName}</span>
            </SheetTitle>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-muted/60"
              aria-label={t("navCloseMenu")}
            >
              <X className="h-5 w-5" />
            </button>
          </SheetHeader>

          <nav className="flex flex-col gap-2 px-4 py-4">
            {CHILD_LINKS.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to !== "/chat"}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  activeClassName="!bg-secondary !text-secondary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="absolute inset-x-0 bottom-0 space-y-3 border-t border-border/50 bg-background p-4">
            <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-xs font-semibold">{t("navTheme")}</span>
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/15"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("navLogout")}</span>
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

export default ChildNavbar;
