import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type DeleteBlogPostInput } from '../schema';
import { deleteBlogPost } from '../handlers/delete_blog_post';
import { eq } from 'drizzle-orm';

// Helper function to create a test blog post
const createTestBlogPost = async () => {
  const result = await db.insert(blogPostsTable)
    .values({
      title: 'Test Blog Post',
      content: 'This is test content for our blog post.',
      author: 'Test Author',
      slug: 'test-blog-post',
      published: false
    })
    .returning()
    .execute();

  return result[0];
};

describe('deleteBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing blog post', async () => {
    // Create a test blog post
    const testPost = await createTestBlogPost();

    const input: DeleteBlogPostInput = {
      id: testPost.id
    };

    // Delete the blog post
    const result = await deleteBlogPost(input);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify the blog post is actually deleted from database
    const deletedPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, testPost.id))
      .execute();

    expect(deletedPosts).toHaveLength(0);
  });

  it('should throw error when blog post does not exist', async () => {
    const input: DeleteBlogPostInput = {
      id: 99999 // Non-existent ID
    };

    // Should throw error for non-existent blog post
    await expect(deleteBlogPost(input)).rejects.toThrow(/Blog post with id 99999 not found/i);
  });

  it('should delete published blog post', async () => {
    // Create a published blog post
    const result = await db.insert(blogPostsTable)
      .values({
        title: 'Published Blog Post',
        content: 'This is published content.',
        author: 'Published Author',
        slug: 'published-blog-post',
        published: true,
        published_at: new Date()
      })
      .returning()
      .execute();

    const publishedPost = result[0];

    const input: DeleteBlogPostInput = {
      id: publishedPost.id
    };

    // Delete the published blog post
    const deleteResult = await deleteBlogPost(input);

    expect(deleteResult.success).toBe(true);

    // Verify the published blog post is deleted
    const deletedPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, publishedPost.id))
      .execute();

    expect(deletedPosts).toHaveLength(0);
  });

  it('should not affect other blog posts when deleting one', async () => {
    // Create multiple blog posts
    const post1 = await createTestBlogPost();
    
    const result2 = await db.insert(blogPostsTable)
      .values({
        title: 'Second Blog Post',
        content: 'This is the second test content.',
        author: 'Another Author',
        slug: 'second-blog-post',
        published: true
      })
      .returning()
      .execute();
    const post2 = result2[0];

    // Delete only the first blog post
    const input: DeleteBlogPostInput = {
      id: post1.id
    };

    const deleteResult = await deleteBlogPost(input);
    expect(deleteResult.success).toBe(true);

    // Verify first post is deleted
    const deletedPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, post1.id))
      .execute();

    expect(deletedPosts).toHaveLength(0);

    // Verify second post still exists
    const remainingPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, post2.id))
      .execute();

    expect(remainingPosts).toHaveLength(1);
    expect(remainingPosts[0].title).toEqual('Second Blog Post');
  });

  it('should handle negative ID values', async () => {
    const input: DeleteBlogPostInput = {
      id: -1
    };

    // Should throw error for negative ID
    await expect(deleteBlogPost(input)).rejects.toThrow(/Blog post with id -1 not found/i);
  });
});