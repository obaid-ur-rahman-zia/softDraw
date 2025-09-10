import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const images = [
  "/placeholder/1.svg",
  "/placeholder/2.svg",
  "/placeholder/3.svg",
  "/placeholder/4.svg",
  "/placeholder/5.svg",
];

export const create = mutation({
  args: {
    orgId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const randomImage = images[Math.floor(Math.random() * images.length)];

    const board = await ctx.db.insert("boards", {
      title: args.title,
      orgId: args.orgId,
      authorId: identity.subject,
      authorName: identity.name!,
      imageUrl: randomImage,
    });

    return board;
  },
});

export const remove = mutation({
  args: {
    id: v.id("boards"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject;

    const existingFavourite = await ctx.db
        .query("userFavourites")
        .withIndex("by_user_board", (q) => 
            q
                .eq("boardId", args.id)
                .eq("userId", userId)
        )
        .unique()

    if(existingFavourite) {
        await ctx.db.delete(existingFavourite._id)
    }

    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("boards"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const title = args.title.trim();

    if (!title) {
      throw new Error("Title is required!");
    }

    if (title.length > 60) {
      throw new Error("Title cannot be longer than 60 characters!");
    }

    const board = ctx.db.patch(args.id, {
      title: args.title,
    });

    return board;
  },
});

export const favourite = mutation({
  args: { id: v.id("boards"), orgId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const board = await ctx.db.get(args.id);
    
    if (!board) {
      throw new Error("Whiteboard not found");
    }
    
    const userId = identity.subject;

    const existingFavourite = await ctx.db
        .query("userFavourites")
        .withIndex("by_user_board", (q) => 
            q
                .eq("boardId", board._id)
                .eq("userId", userId)
        )
        .unique()

    if(existingFavourite) {
        throw new Error("Whiteboard already favourited!")
    }

    await ctx.db.insert("userFavourites", {
        userId,
        boardId: board._id,
        orgId: args.orgId
    })

    return board
  },
});



export const unfavourite = mutation({
  args: { id: v.id("boards")},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const board = await ctx.db.get(args.id);
    
    if (!board) {
      throw new Error("Whiteboard not found");
    }
    
    const userId = identity.subject;

    const existingFavourite = await ctx.db
        .query("userFavourites")
        .withIndex("by_user_board", (q) => 
            q
                .eq("boardId", board._id)
                .eq("userId", userId)
        )
        .unique()

    if(!existingFavourite) {
        throw new Error("Favourited whiteboard not found!")
    }

    await ctx.db.delete(existingFavourite._id)

    return board
  },
});



export const get = query({
  args: {id: v.id("boards")},
  handler: async (ctx, args) => {
    const board = ctx.db.get(args.id);

    return board
  }
})