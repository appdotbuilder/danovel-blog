import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type PublishBlogPostInput, type BlogPost } from '../schema';
import { eq } from 'drizzle-orm';

export const publishBlogPost = async (input: PublishBlogPostInput): Promise<BlogPost> => {
  try {
    // First, check if the blog post exists
    const existingPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, input.id))
      .execute();

    if (existingPosts.length === 0) {
      throw new Error(`Blog post with ID ${input.id} not found`);
    }

    const existingPost = existingPosts[0];

    // Prepare update values
    const updateValues: any = {
      published: input.published,
      updated_at: new Date()
    };

    // Handle published_at logic
    if (input.published && !existingPost.published_at) {
      // Publishing for the first time - set published_at to current timestamp
      updateValues.published_at = new Date();
    } else if (!input.published) {
      // Unpublishing - set published_at to null
      updateValues.published_at = null;
    }
    // If already published and we're re-publishing, keep existing published_at

    // Update the blog post
    const result = await db.update(blogPostsTable)
      .set(updateValues)
      .where(eq(blogPostsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Blog post publish operation failed:', error);
    throw error;
  }
};