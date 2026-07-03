"use client";

import { useOrg } from "@/providers/org-provider";
import Item from "./item";

const List = () => {
  const { orgs } = useOrg();

  if (!orgs.length) return null;

  return (
    <ul className="space-y-4">
      {orgs.map((org) => (
        <Item
          key={org.id}
          id={org.id}
          name={org.name}
          imageUrl={org.imageUrl}
        />
      ))}
    </ul>
  );
};

export default List;
