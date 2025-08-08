import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { BlogPost } from '../../../server/src/schema';

interface BlogPostCardProps {
  post: BlogPost;
  onRead: (post: BlogPost) => void;
  onEdit: (post: BlogPost) => void;
  onTogglePublish: (post: BlogPost) => void;
  onDelete: (id: number) => void;
}

export function BlogPostCard({ post, onRead, onEdit, onTogglePublish, onDelete }: BlogPostCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onRead(post)}>
              {post.title}
            </CardTitle>
            <CardDescription className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span>📝 By <strong>{post.author}</strong></span>
              <span>•</span>
              <span>📅 {post.created_at.toLocaleDateString()}</span>
              {post.published && post.published_at && (
                <>
                  <span>•</span>
                  <span>🚀 Published {post.published_at.toLocaleDateString()}</span>
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={post.published ? 'default' : 'secondary'} className="shrink-0">
              {post.published ? '🟢 Published' : '🟡 Draft'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
        </p>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRead(post)}
            className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
          >
            📖 Read More
          </Button>
          <div className="flex space-x-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTogglePublish(post)}
              className={post.published ? 
                "hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300" : 
                "hover:bg-green-50 hover:text-green-700 hover:border-green-300"
              }
            >
              {post.published ? '📤 Unpublish' : '📢 Publish'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(post)}
              className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
            >
              ✏️ Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                >
                  🗑️ Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "<strong>{post.title}</strong>"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(post.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}