import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { BlogPost } from '../../../server/src/schema';

interface BlogPostReaderProps {
  post: BlogPost;
  onBack: () => void;
  onEdit: (post: BlogPost) => void;
  onTogglePublish: (post: BlogPost) => void;
}

export function BlogPostReader({ post, onBack, onEdit, onTogglePublish }: BlogPostReaderProps) {
  // Format content with better line breaks and paragraphs
  const formatContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') {
        return <br key={index} />;
      }
      return (
        <p key={index} className="mb-4 leading-relaxed text-slate-700">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="hover:bg-slate-100"
              >
                ← Back to Posts
              </Button>
              <Badge variant={post.published ? 'default' : 'secondary'} className="shrink-0">
                {post.published ? '🟢 Published' : '🟡 Draft'}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <CardTitle className="text-4xl font-bold leading-tight text-slate-900">
              {post.title}
            </CardTitle>
            
            <CardDescription className="text-lg space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-slate-600">
                <div className="flex items-center gap-2">
                  <span>👤</span>
                  <span className="font-semibold text-slate-700">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>Created {post.created_at.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                {post.published && post.published_at && (
                  <div className="flex items-center gap-2">
                    <span>🚀</span>
                    <span>Published {post.published_at.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
                <span>📝</span>
                <span>{post.content.length} characters</span>
                <span>•</span>
                <span>~{Math.ceil(post.content.split(' ').length / 200)} min read</span>
              </div>
            </CardDescription>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-8">
          <div className="prose max-w-none">
            <div className="text-lg leading-relaxed">
              {formatContent(post.content)}
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex items-center justify-between bg-slate-50 p-6 rounded-lg">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Manage this post</h3>
              <p className="text-sm text-slate-600">Edit content or change publish status</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
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
                onClick={() => onEdit(post)}
                className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
              >
                ✏️ Edit Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}