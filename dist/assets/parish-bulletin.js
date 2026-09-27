const categories = ['Project transparency', 'Donations & contributions', 'Visiting priests', 'Fundraising', 'Parish matters'];
const samples = [
  ['Parish improvement project', 'Project transparency', 'Project progress, completed work, expenses, and the next steps will be shared here for parishioners to review.'],
  ['Community contributions update', 'Donations & contributions', 'The parish can publish summaries of donations received and how contributions support parish activities. Personal donor information should only be shared with permission.'],
  ['Support for invited priests', 'Visiting priests', 'Updates about support for visiting priests, including travel, accommodation, and pastoral activities, will appear here.'],
  ['Upcoming parish fundraiser', 'Fundraising', 'Fundraising announcements can explain the purpose, activities, and how parishioners can take part. Confirm arrangements with the parish office.'],
  ['A message from the parish office', 'Parish matters', 'Important community updates and other parish matters will be posted in this section.'],
].map(([title, category, content], index) => ({ id: `sample-${index}`, title, category, content, sample: true }));

export function ParishBulletin({ React, readPosts, accessToken }) {
  const h = React.createElement;
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [category, setCategory] = React.useState('All updates');
  const [revision, setRevision] = React.useState(0);
  const [showSamples, setShowSamples] = React.useState(true);
  React.useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setPosts([]);
    (async () => {
      try {
        if (!accessToken) throw new Error('Please sign in again to load parish posts.');
        const rows = await readPosts('parish_bulletins', 'select=id,title,content,category,published_at,parishes(parish_name)&status=eq.Published&order=published_at.desc&limit=100', accessToken);
        if (active) setPosts(Array.isArray(rows) ? rows : []);
      } catch {
        if (active) setError('Parish updates could not be loaded. Please try again.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [readPosts, accessToken, revision]);
  const preview = !loading && !posts.length && showSamples;
  const items = (preview ? samples : posts).filter(post => category === 'All updates' || post.category === category);
  return h('section', { className: 'parish-bulletin', 'aria-label': 'Parish Bulletin' },
    h('header', { className: 'bulletin-intro' },
      h('div', null, h('p', { className: 'bulletin-eyebrow' }, 'From your parish'), h('h4', null, 'Parish Bulletin'),
        h('p', null, 'Project transparency, donations, support for invited priests, fundraising activities, and important parish matters.')),
      h('button', { type: 'button', className: 'secondary-action', disabled: loading, onClick: () => setRevision(value => value + 1) }, loading ? 'Loading…' : 'Refresh')),
    error && h('p', { className: 'bulletin-notice', role: 'alert' }, error),
    !loading && !posts.length && h('div', { className: 'bulletin-notice', role: 'status' },
      h('p', null, preview ? 'Sample preview — these examples demonstrate the layout. They are not actual parish posts or financial reports.' : error ? 'No parish posts are available to display.' : 'No published updates yet. Please check back for news from your parish.'),
      h('button', { type: 'button', className: 'secondary-action', onClick: () => setShowSamples(value => !value) }, preview ? 'Hide samples' : 'Show sample preview')),
    h('label', { className: 'login-field bulletin-filter' }, h('span', null, 'Category'),
      h('select', { value: category, onChange: event => setCategory(event.target.value) }, ['All updates', ...categories].map(value => h('option', { key: value, value }, value)))),
    loading ? h('p', { role: 'status' }, 'Loading posts from your parish…') :
      h('div', { className: 'bulletin-grid' }, items.map(post => h('article', { key: post.id, className: 'bulletin-post' },
        h('div', { className: 'bulletin-post-meta' }, h('span', null, post.category), post.sample && h('strong', null, 'Sample')),
        h('h4', null, post.title),
        h('p', { className: 'bulletin-author' }, post.sample ? 'Example parish update' : `Posted by ${post.parishes?.parish_name || 'the parish office'}`),
        !post.sample && post.published_at && h('time', { dateTime: post.published_at }, new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })),
        h('p', { className: 'bulletin-content' }, post.content))),
        !items.length && h('p', null, 'No updates in this category.')));
}
