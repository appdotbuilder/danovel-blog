import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type DeleteBlogPostInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteBlogPost(input: DeleteBlogPostInput): Promise<{ success: boolean }> {
  try {
    // First, check if the blog post exists
    const existingPost = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, input.id))
      .execute();

    if (existingPost.length === 0) {
      throw new Error(`Blog post with id ${input.id} not found`);
    }

    // Delete the blog post
    const result = await db.delete(blogPostsTable)
      .where(eq(blogPostsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Blog post deletion failed:', error);
    throw error;
  }
}