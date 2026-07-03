"use client";

import { Hint } from "@/components/hint";
import { Plus } from "lucide-react";
import { CreateOrgDialog } from "@/components/org/create-org-dialog";

const NewButton = () => {
  return (
    <CreateOrgDialog>
      <div className="aspect-square">
        <Hint
          label="Create team"
          side="right"
          align="start"
          sideOffset={18}
        >
          <button className="bg-white/25 h-full w-full rounded-md flex items-center justify-center opacity-60 hover:opacity-100 transition">
            <Plus className="text-white" />
          </button>
        </Hint>
      </div>
    </CreateOrgDialog>
  );
};

export default NewButton;
