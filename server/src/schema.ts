import { z } from 'zod';

// Blog post schema
export const blogPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  author: z.string(),
  slug: z.string(), // URL-friendly version of title
  published: z.boolean(),
  published_at: z.coerce.date().nullable(), // Can be null if not published yet
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BlogPost = z.infer<typeof blogPostSchema>;

// Input schema for creating blog posts
export const createBlogPostInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  author: z.string().min(1, "Author is required"),
  published: z.boolean().default(false) // Default to draft
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;

// Input schema for updating blog posts
export const updateBlogPostInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  author: z.string().min(1, "Author is required").optional(),
  published: z.boolean().optional()
});

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;

// Input schema for getting blog posts with filters
export const getBlogPostsInputSchema = z.object({
  published: z.boolean().optional(), // Filter by published status
  author: z.string().optional(), // Filter by author
  limit: z.number().int().positive().max(100).default(10), // Pagination limit
  offset: z.number().int().nonnegative().default(0) // Pagination offset
});

export type GetBlogPostsInput = z.infer<typeof getBlogPostsInputSchema>;

// Input schema for getting a single blog post
export const getBlogPostInputSchema = z.object({
  id: z.number().optional(),
  slug: z.string().optional()
}).refine(
  (data) => data.id !== undefined || data.slug !== undefined,
  "Either id or slug must be provided"
);

export type GetBlogPostInput = z.infer<typeof getBlogPostInputSchema>;

// Input schema for deleting blog posts
export const deleteBlogPostInputSchema = z.object({
  id: z.number()
});

export type DeleteBlogPostInput = z.infer<typeof deleteBlogPostInputSchema>;

// Input schema for publishing/unpublishing blog posts
export const publishBlogPostInputSchema = z.object({
  id: z.number(),
  published: z.boolean()
});

export type PublishBlogPostInput = z.infer<typeof publishBlogPostInputSchema>;