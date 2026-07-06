import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import React from "react";
// import { useTranslation } from "react-i18next";
import {
  Search,
  Users,
  UserCheck,
  Baby,
  Loader2,
  AlertCircle,
} from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PlayfulBackground from "@/components/PlayfulBackground";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listAccounts } from "@/lib/accounts";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
type FilterType = "all" | "parent" | "child";
type AccountRow = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  type: "parent" | "child";
};
const Accounts = () => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    listAccounts()
      .then((rows) => {
        if (cancelled) return;
        setAccounts(rows);
        setState("ready");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (filter !== "all" && a.type !== filter) return false;
      if (!q) return true;
      return (
        a.username.toLowerCase().includes(q) ||
        a.firstName.toLowerCase().includes(q) ||
        a.lastName.toLowerCase().includes(q) ||
        (a.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [accounts, search, filter]);

  const counts = useMemo(
    () => ({
      all: accounts.length,
      parent: accounts.filter((a) => a.type === "parent").length,
      child: accounts.filter((a) => a.type === "child").length,
    }),
    [accounts],
  );

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 playful-bg opacity-60" aria-hidden />
      <PlayfulBackground />

      <div className="relative z-10">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6 animate-fade-slide-up">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
              {t("accountsTitle")}
              <span className="text-3xl">👥</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("accountsSubtitle")}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl shadow-soft border border-border/50 p-4 mb-5 animate-fade-slide-up">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchAccounts")}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <FilterPill
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                  icon={Users}
                  label={`${t("all")} (${counts.all})`}
                />
                <FilterPill
                  active={filter === "parent"}
                  onClick={() => setFilter("parent")}
                  icon={UserCheck}
                  label={`${t("parents")} (${counts.parent})`}
                />
                <FilterPill
                  active={filter === "child"}
                  onClick={() => setFilter("child")}
                  icon={Baby}
                  label={`${t("children")} (${counts.child})`}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          {state === "loading" && (
            <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {t("loadingAccounts")}
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="bg-card rounded-2xl p-10 text-center border border-destructive/30">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-bold text-lg">{t("couldntLoadAccounts")}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {t("tryAgain")}
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                {t("tryAgain")}
              </Button>
            </div>
          )}

          {state === "ready" && filtered.length === 0 && (
            <div className="bg-card rounded-3xl p-12 text-center border border-border/50 shadow-soft animate-scale-fade-in">
              <div className="text-5xl mb-3">👀</div>
              <h3 className="text-xl font-bold mb-1">{t("noAccountsFound")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("noAccountsFoundHint")}
              </p>
            </div>
          )}

          {state === "ready" && filtered.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden animate-fade-slide-up">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>{t("user")}</TableHead>
                    <TableHead>{t("username")}</TableHead>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("email")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a, i) => (
                    <TableRow
                      key={a.id}
                      className="animate-fade-slide-up opacity-0"
                      style={{
                        animationDelay: `${i * 60}ms`,
                        animationFillMode: "forwards",
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
                              a.type === "parent"
                                ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
                                : "bg-gradient-to-br from-accent to-secondary text-foreground",
                            )}
                          >
                            {a.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">
                              {a.firstName} {a.lastName}
                            </div>
                            {a.email ? (
                              <div className="text-xs text-muted-foreground md:hidden truncate">
                                {a.email}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        @{a.username}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                            a.type === "parent"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary/30 text-secondary-foreground",
                          )}
                        >
                         {a.type === "parent" ? `👤 ${t("parents")}` : `🧒 ${t("children")}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                        {a.email ?? t("none")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const FilterPill = ({
  active,
  onClick,
  icon: Icon,
  label,
}: FilterPillProps) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 whitespace-nowrap",
      active
        ? "border-primary bg-primary/10 text-primary shadow-soft"
        : "border-input bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

export default Accounts;
