import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type GetBlogPostInput } from '../schema';
import { getBlogPost } from '../handlers/get_blog_post';

describe('getBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test blog posts
  const createTestBlogPost = async (overrides = {}) => {
    const testPost = {
      title: 'Test Blog Post',
      content: 'This is test content for the blog post',
      author: 'Test Author',
      slug: 'test-blog-post',
      published: false,
      published_at: null,
      ...overrides
    };

    const result = await db.insert(blogPostsTable)
      .values(testPost)
      .returning()
      .execute();

    return result[0];
  };

  it('should get a blog post by ID', async () => {
    // Create test blog post
    const createdPost = await createTestBlogPost();

    // Test input with ID
    const input: GetBlogPostInput = {
      id: createdPost.id
    };

    const result = await getBlogPost(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPost.id);
    expect(result!.title).toEqual('Test Blog Post');
    expect(result!.content).toEqual('This is test content for the blog post');
    expect(result!.author).toEqual('Test Author');
    expect(result!.slug).toEqual('test-blog-post');
    expect(result!.published).toEqual(false);
    expect(result!.published_at).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should get a blog post by slug', async () => {
    // Create test blog post
    const createdPost = await createTestBlogPost({
      title: 'Another Test Post',
      slug: 'another-test-post'
    });

    // Test input with slug
    const input: GetBlogPostInput = {
      slug: 'another-test-post'
    };

    const result = await getBlogPost(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPost.id);
    expect(result!.title).toEqual('Another Test Post');
    expect(result!.slug).toEqual('another-test-post');
  });

  it('should get a published blog post with published_at date', async () => {
    // Create published blog post
    const publishedAt = new Date('2023-01-15T10:00:00Z');
    const createdPost = await createTestBlogPost({
      title: 'Published Post',
      slug: 'published-post',
      published: true,
      published_at: publishedAt
    });

    const input: GetBlogPostInput = {
      id: createdPost.id
    };

    const result = await getBlogPost(input);

    // Verify published post data
    expect(result).not.toBeNull();
    expect(result!.published).toEqual(true);
    expect(result!.published_at).toBeInstanceOf(Date);
    expect(result!.published_at!.getTime()).toEqual(publishedAt.getTime());
  });

  it('should return null when blog post is not found by ID', async () => {
    const input: GetBlogPostInput = {
      id: 999999 // Non-existent ID
    };

    const result = await getBlogPost(input);

    expect(result).toBeNull();
  });

  it('should return null when blog post is not found by slug', async () => {
    const input: GetBlogPostInput = {
      slug: 'non-existent-slug'
    };

    const result = await getBlogPost(input);

    expect(result).toBeNull();
  });

  it('should handle both ID and slug provided (should use OR logic)', async () => {
    // Create two different blog posts
    const post1 = await createTestBlogPost({
      title: 'Post One',
      slug: 'post-one'
    });

    const post2 = await createTestBlogPost({
      title: 'Post Two',
      slug: 'post-two'
    });

    // Provide ID of post1 and slug of post2 - should match post1 (OR logic)
    const input: GetBlogPostInput = {
      id: post1.id,
      slug: 'post-two'
    };

    const result = await getBlogPost(input);

    // Should return post1 since OR logic matches the ID
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(post1.id);
    expect(result!.title).toEqual('Post One');
  });

  it('should handle case where both ID and slug match the same post', async () => {
    // Create test blog post
    const createdPost = await createTestBlogPost({
      title: 'Matching Post',
      slug: 'matching-post'
    });

    // Provide both ID and slug of the same post
    const input: GetBlogPostInput = {
      id: createdPost.id,
      slug: 'matching-post'
    };

    const result = await getBlogPost(input);

    // Should return the post
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPost.id);
    expect(result!.slug).toEqual('matching-post');
    expect(result!.title).toEqual('Matching Post');
  });

  it('should return null when neither ID nor slug matches', async () => {
    // Create a test blog post
    await createTestBlogPost();

    // Provide non-matching ID and slug
    const input: GetBlogPostInput = {
      id: 999999,
      slug: 'non-existent-slug'
    };

    const result = await getBlogPost(input);

    expect(result).toBeNull();
  });
});