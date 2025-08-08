import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type UpdateBlogPostInput, type BlogPost } from '../schema';
import { eq } from 'drizzle-orm';

// Helper function to generate URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();
}

export async function updateBlogPost(input: UpdateBlogPostInput): Promise<BlogPost> {
  try {
    // First, check if the blog post exists
    const existingPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, input.id))
      .execute();

    if (existingPosts.length === 0) {
      throw new Error(`Blog post with id ${input.id} not found`);
    }

    const existingPost = existingPosts[0];

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date()
    };

    // Update title and regenerate slug if title is provided
    if (input.title !== undefined) {
      updateData.title = input.title;
      updateData.slug = generateSlug(input.title);
    }

    // Update content if provided
    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    // Update author if provided
    if (input.author !== undefined) {
      updateData.author = input.author;
    }

    // Handle published status changes
    if (input.published !== undefined) {
      updateData.published = input.published;
      
      // If changing to published and no published_at date exists, set it now
      if (input.published === true && !existingPost.published_at) {
        updateData.published_at = new Date();
      }
      
      // If changing to unpublished, clear published_at
      if (input.published === false) {
        updateData.published_at = null;
      }
    }

    // Perform the update
    const result = await db.update(blogPostsTable)
      .set(updateData)
      .where(eq(blogPostsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Blog post update failed:', error);
    throw error;
  }
}