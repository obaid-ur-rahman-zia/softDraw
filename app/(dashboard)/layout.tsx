import { getActiveContext } from "@/lib/queries";
import { OrgProvider } from "@/providers/org-provider";
import Navbar from "./_components/navbar";
import OrgSidebar from "./_components/org-sidebar";
import Sidebar from "./_components/sidebar";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const ctx = await getActiveContext();
  const orgs = ctx?.orgs ?? [];
  const activeOrgId = ctx?.activeOrg?.id ?? null;

  return (
    <OrgProvider orgs={orgs} activeOrgId={activeOrgId}>
      <main className="h-full">
        <Sidebar />
        <div className="pl-[60px] h-full ">
          <div className="flex gap-x-3 h-full">
            <OrgSidebar />
            <div className="h-full flex-1">
              <Navbar />
              {children}
            </div>
          </div>
        </div>
      </main>
    </OrgProvider>
  );
};

export default DashboardLayout;
