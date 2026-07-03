"use client";

import { SearchInput } from "./search-input";
import { InviteButton } from "./invite-button";
import { OrgSwitcher } from "@/components/org/org-switcher";
import { UserButton } from "@/components/org/user-button";
import { useOrg } from "@/providers/org-provider";

const Navbar = () => {
  const { activeOrg } = useOrg();

  return (
    <div className="flex items-center gap-x-4 p-5 ">
      <div className="hidden lg:flex lg:flex-1">
        <SearchInput />
      </div>
      <div className="block lg:hidden flex-1 max-w-[376px]">
        <OrgSwitcher />
      </div>
      {activeOrg && <InviteButton />}
      <UserButton />
    </div>
  );
};

export default Navbar;
