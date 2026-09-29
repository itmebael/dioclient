const categories = ['Project transparency', 'Donations & contributions', 'Visiting priests', 'Fundraising', 'Parish matters'];

export function ParishBulletin({ React, readPosts, accessToken }) {
  const h = React.createElement;
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [category, setCategory] = React.useState('All updates');

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        if (!accessToken) throw new Error('Please sign in again to load parish posts.');
        const rows = await readPosts('parish_bulletins', 'select=id,title,content,category,published_at,parishes(parish_name)&status=eq.Published&order=published_at.desc&limit=100', accessToken);
        if (active) setPosts(Array.isArray(rows) ? rows : []);
      } catch {
        if (active) setError('Parish updates could not be loaded. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [readPosts, accessToken]);

  const items = posts.filter(post => category === 'All updates' || post.category === category);
  return h('section', { className: 'parish-bulletin', 'aria-label': 'Parish Bulletin' },
    error && h('p', { className: 'bulletin-notice', role: 'alert' }, error),
    h('label', { className: 'login-field bulletin-filter' }, h('span', null, 'Category'),
      h('select', { value: category, onChange: event => setCategory(event.target.value) }, ['All updates', ...categories].map(value => h('option', { key: value, value }, value)))),
    loading ? h('p', { role: 'status' }, 'Loading posts from your parish…') :
      h('div', { className: 'bulletin-grid' }, items.map(post => h('article', { key: post.id, className: 'bulletin-post' },
        h('div', { className: 'bulletin-post-meta' }, h('span', null, post.category)),
        h('h4', null, post.title),
        h('p', { className: 'bulletin-author' }, `Posted by ${post.parishes?.parish_name || 'the parish office'}`),
        post.published_at && h('time', { dateTime: post.published_at }, new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })),
        h('p', { className: 'bulletin-content' }, post.content))),
        !items.length && h('p', null, 'No updates in this category.')));
}
