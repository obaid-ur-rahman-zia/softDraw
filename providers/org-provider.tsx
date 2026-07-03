"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { setActiveOrg } from "@/app/actions/org";
import type { OrgSummary } from "@/lib/queries";

interface OrgContextValue {
  orgs: OrgSummary[];
  activeOrg: OrgSummary | null;
  activeOrgId: string | null;
  switching: boolean;
  switchOrg: (orgId: string) => void;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  orgs,
  activeOrgId,
  children,
}: {
  orgs: OrgSummary[];
  activeOrgId: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [switching, startTransition] = useTransition();

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;

  const switchOrg = (orgId: string) => {
    if (orgId === activeOrgId) return;
    startTransition(async () => {
      await setActiveOrg({ orgId });
      router.refresh();
    });
  };

  return (
    <OrgContext.Provider
      value={{ orgs, activeOrg, activeOrgId, switching, switchOrg }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within an OrgProvider");
  return ctx;
}
