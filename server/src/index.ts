import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createBlogPostInputSchema,
  updateBlogPostInputSchema,
  getBlogPostsInputSchema,
  getBlogPostInputSchema,
  deleteBlogPostInputSchema,
  publishBlogPostInputSchema
} from './schema';

// Import handlers
import { createBlogPost } from './handlers/create_blog_post';
import { getBlogPosts } from './handlers/get_blog_posts';
import { getBlogPost } from './handlers/get_blog_post';
import { updateBlogPost } from './handlers/update_blog_post';
import { deleteBlogPost } from './handlers/delete_blog_post';
import { publishBlogPost } from './handlers/publish_blog_post';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Blog post CRUD operations
  createBlogPost: publicProcedure
    .input(createBlogPostInputSchema)
    .mutation(({ input }) => createBlogPost(input)),

  getBlogPosts: publicProcedure
    .input(getBlogPostsInputSchema)
    .query(({ input }) => getBlogPosts(input)),

  getBlogPost: publicProcedure
    .input(getBlogPostInputSchema)
    .query(({ input }) => getBlogPost(input)),

  updateBlogPost: publicProcedure
    .input(updateBlogPostInputSchema)
    .mutation(({ input }) => updateBlogPost(input)),

  deleteBlogPost: publicProcedure
    .input(deleteBlogPostInputSchema)
    .mutation(({ input }) => deleteBlogPost(input)),

  publishBlogPost: publicProcedure
    .input(publishBlogPostInputSchema)
    .mutation(({ input }) => publishBlogPost(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`DANOVEL Blog TRPC server listening at port: ${port}`);
}

start();