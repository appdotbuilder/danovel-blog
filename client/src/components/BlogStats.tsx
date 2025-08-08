import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlogPost } from '../../../server/src/schema';

interface BlogStatsProps {
  posts: BlogPost[];
}

export function BlogStats({ posts }: BlogStatsProps) {
  const publishedPosts = posts.filter((post: BlogPost) => post.published);
  const draftPosts = posts.filter((post: BlogPost) => !post.published);
  const totalWordCount = posts.reduce((acc: number, post: BlogPost) => acc + post.content.split(' ').length, 0);
  const averageWordsPerPost = posts.length > 0 ? Math.round(totalWordCount / posts.length) : 0;

  const stats = [
    {
      title: 'Total Posts',
      value: posts.length,
      description: 'All blog posts',
      icon: '📝',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Published',
      value: publishedPosts.length,
      description: 'Live posts',
      icon: '🚀',
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      title: 'Drafts',
      value: draftPosts.length,
      description: 'Work in progress',
      icon: '📄',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    },
    {
      title: 'Avg. Words',
      value: averageWordsPerPost,
      description: 'Per post',
      icon: '📊',
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className={`${stat.color} border transition-all hover:shadow-md`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs font-medium opacity-80">{stat.title}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}