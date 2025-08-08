import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type UpdateBlogPostInput, type CreateBlogPostInput } from '../schema';
import { updateBlogPost } from '../handlers/update_blog_post';
import { eq } from 'drizzle-orm';

// Helper function to create a test blog post
async function createTestBlogPost(data: Partial<CreateBlogPostInput> = {}) {
  const defaultData = {
    title: 'Test Blog Post',
    content: 'This is test content for the blog post.',
    author: 'Test Author',
    published: false
  };

  const slug = (data.title || defaultData.title)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const result = await db.insert(blogPostsTable)
    .values({
      ...defaultData,
      ...data,
      slug,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();

  return result[0];
}

describe('updateBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update blog post title and regenerate slug', async () => {
    // Create test blog post
    const testPost = await createTestBlogPost();
    
    const input: UpdateBlogPostInput = {
      id: testPost.id,
      title: 'Updated Blog Post Title'
    };

    const result = await updateBlogPost(input);

    expect(result.id).toEqual(testPost.id);
    expect(result.title).toEqual('Updated Blog Post Title');
    expect(result.slug).toEqual('updated-blog-post-title');
    expect(result.content).toEqual(testPost.content); // Should remain unchanged
    expect(result.author).toEqual(testPost.author); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testPost.updated_at).toBe(true);
  });

  it('should update blog post content', async () => {
    const testPost = await createTestBlogPost();
    
    const input: UpdateBlogPostInput = {
      id: testPost.id,
      content: 'Updated content for the blog post.'
    };

    const result = await updateBlogPost(input);

    expect(result.id).toEqual(testPost.id);
    expect(result.title).toEqual(testPost.title); // Should remain unchanged
    expect(result.content).toEqual('Updated content for the blog post.');
    expect(result.slug).toEqual(testPost.slug); // Should remain unchanged
    expect(result.updated_at > testPost.updated_at).toBe(true);
  });

  it('should update blog post author', async () => {
    const testPost = await createTestBlogPost();
    
    const input: UpdateBlogPostInput = {
      id: testPost.id,
      author: 'Updated Author'
    };

    const result = await updateBlogPost(input);

    expect(result.id).toEqual(testPost.id);
    expect(result.author).toEqual('Updated Author');
    expect(result.title).toEqual(testPost.title); // Should remain unchanged
    expect(result.content).toEqual(testPost.content); // Should remain unchanged
    expect(result.updated_at > testPost.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const testPost = await createTestBlogPost();
    
    const input: UpdateBlogPostInput = {
      id: testPost.id,
      title: 'New Title',
      content: 'New content',
      author: 'New Author'
    };

    const result = await updateBlogPost(input);

    expect(result.id).toEqual(testPost.id);
    expect(result.title).toEqual('New Title');
    expect(result.content).toEqual('New content');
    expect(result.author).toEqual('New Author');
    expect(result.slug).toEqual('new-title');
    expect(result.updated_at > testPost.updated_at).toBe(true);
  });

  it('should publish blog post and set published_at', async () => {
    // Create unpublished blog post
    const testPost = await createTestBlogPost({ published: false });
    expect(testPost.published_at).toBeNull();
    
    const input: UpdateBlogPostInput = {
      id: testPost.id,
      published: true
    };

    const result = await updateBlogPost(input);

    expect(result.id).toEqual(testPost.id);
    expect(result.published).toBe(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at).not.toBeNull();
    expect(result.updated_at > testPost.updated_at).toBe(true);
  });

  it('should unpublish blog post and clear published_at', async () => {
    // Create published blog post
    const testPost = await createTestBlogPost({ published: true });
    // Manually set published_at for the test
    await db.update(blogPostsTable)
      .set({ published_at: new Date() })
      .where(eq(blogPostsTable.id, testPost.id))
      .execute();
    
    const input: UpdateBlogPostInput = {
      id: testPost.id,
      published: false
    };

    const result = await updateBlogPost(input);

    expect(result.id).toEqual(testPost.id);
    expect(result.published).toBe(false);
    expect(result.published_at).toBeNull();
    expect(result.updated_at > testPost.updated_at).toBe(true);
  });

  it('should not change published_at when already published and staying published', async () => {
    // Create published blog post with published_at already set
    const publishedAt = new Date('2023-01-01T10:00:00Z');
    const testPost = await createTestBlogPost({ published: true });
    
    await db.update(blogPostsTable)
      .set({ published_at: publishedAt })
      .where(eq(blogPostsTable.id, testPost.id))
      .execute();
    
    const input: UpdateBlogPostInput = {
      id: testPost.id,
      published: true, // Keep published
      title: 'Updated Title'
    };

    const result = await updateBlogPost(input);

    expect(result.published).toBe(true);
    expect(result.published_at).toEqual(publishedAt); // Should remain the same
    expect(result.title).toEqual('Updated Title');
  });

  it('should handle special characters in title when generating slug', async () => {
    const testPost = await createTestBlogPost();
    
    const input: UpdateBlogPostInput = {
      id: testPost.id,
      title: 'My Amazing Blog Post!!! With @Special# Characters & Spaces'
    };

    const result = await updateBlogPost(input);

    expect(result.title).toEqual('My Amazing Blog Post!!! With @Special# Characters & Spaces');
    expect(result.slug).toEqual('my-amazing-blog-post-with-special-characters-spaces');
  });

  it('should save updated blog post to database', async () => {
    const testPost = await createTestBlogPost();
    
    const input: UpdateBlogPostInput = {
      id: testPost.id,
      title: 'Database Update Test',
      content: 'Testing database persistence'
    };

    const result = await updateBlogPost(input);

    // Verify the update was persisted to database
    const updatedPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(updatedPosts).toHaveLength(1);
    const dbPost = updatedPosts[0];
    expect(dbPost.title).toEqual('Database Update Test');
    expect(dbPost.content).toEqual('Testing database persistence');
    expect(dbPost.slug).toEqual('database-update-test');
    expect(dbPost.updated_at).toBeInstanceOf(Date);
    expect(dbPost.updated_at > testPost.updated_at).toBe(true);
  });

  it('should throw error when blog post does not exist', async () => {
    const input: UpdateBlogPostInput = {
      id: 999999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateBlogPost(input)).rejects.toThrow(/blog post with id 999999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const testPost = await createTestBlogPost();
    
    const input: UpdateBlogPostInput = {
      id: testPost.id
      // No fields to update
    };

    const result = await updateBlogPost(input);

    // Should only update the updated_at timestamp
    expect(result.id).toEqual(testPost.id);
    expect(result.title).toEqual(testPost.title);
    expect(result.content).toEqual(testPost.content);
    expect(result.author).toEqual(testPost.author);
    expect(result.slug).toEqual(testPost.slug);
    expect(result.published).toEqual(testPost.published);
    expect(result.updated_at > testPost.updated_at).toBe(true);
  });
});