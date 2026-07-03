import { Button } from "@/components/ui/button";
import { CreateOrgDialog } from "@/components/org/create-org-dialog";
import { APP } from "@/lib/constants";
import Image from "next/image";
import React from "react";

const EmptyOrg = () => {
  return (
    <div className="h-full items-center justify-center flex flex-col">
      <Image src={"/elements.svg"} alt="empty" height={200} width={200} />
      <h2 className="text-2xl font-semibold mt-6">
        Welcome to {APP.APP_NAME}
      </h2>
      <p className="text-muted-foreground text-sm mt-2">
        Create a team to get started
      </p>
      <div className="mt-6">
        <CreateOrgDialog>
          <Button size={"lg"}>Create team</Button>
        </CreateOrgDialog>
      </div>
    </div>
  );
};

export default EmptyOrg;
